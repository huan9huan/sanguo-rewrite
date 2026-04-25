#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tools.google_tts import get_access_token, infer_language_code, load_credentials, synthesize


DEFAULT_VOICES = {
    "cmn-CN": [
        "cmn-CN-Chirp3-HD-Charon",
        "cmn-CN-Chirp3-HD-Orus",
        "cmn-CN-Chirp3-HD-Fenrir",
        "cmn-CN-Chirp3-HD-Iapetus",
        "cmn-CN-Wavenet-A",
    ],
    "en-US": [
        "en-US-Chirp3-HD-Charon",
        "en-US-Chirp3-HD-Orus",
        "en-US-Chirp3-HD-Fenrir",
        "en-US-Neural2-J",
        "en-US-Studio-Q",
    ],
    "en-GB": [
        "en-GB-Chirp3-HD-Charon",
        "en-GB-Chirp3-HD-Orus",
        "en-GB-Chirp3-HD-Fenrir",
        "en-GB-Studio-B",
    ],
}


DEFAULT_TEXT = {
    "cmn-CN": "桃园之中，三人结为兄弟。[pause long] 乱世，从这一刻开始改变。",
    "en-US": "In the Three Kingdoms, three men made a vow. [pause long] History changed from that day.",
    "en-GB": "In the Three Kingdoms, three men made a vow. [pause long] History changed from that day.",
}


def duration_seconds(path: Path) -> float | None:
    proc = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=nw=1:nk=1",
            str(path),
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        return None
    try:
        return round(float(proc.stdout.strip()), 3)
    except ValueError:
        return None


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate a small audition set for Google Cloud TTS voices."
    )
    text_group = parser.add_mutually_exclusive_group()
    text_group.add_argument("--text", help="Audition text.")
    text_group.add_argument("--text-file", type=Path, help="UTF-8 audition text file.")
    parser.add_argument("--out-dir", type=Path, required=True, help="Output directory.")
    parser.add_argument("--credentials", type=Path, help="Service account JSON path.")
    parser.add_argument("--language-code", default="cmn-CN", help="BCP-47 language code.")
    parser.add_argument(
        "--voice",
        action="append",
        dest="voices",
        help="Voice to audition. Can be repeated. Defaults to the language shortlist.",
    )
    parser.add_argument("--rate", type=float, default=0.9, help="Speaking rate.")
    parser.add_argument(
        "--input-kind",
        choices=["text", "ssml", "markup"],
        default="markup",
        help="Google TTS input field to use.",
    )
    parser.add_argument(
        "--encoding",
        default="MP3",
        choices=["MP3", "LINEAR16", "OGG_OPUS", "MULAW", "ALAW"],
        help="Google TTS audio encoding.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    voices = args.voices or DEFAULT_VOICES.get(args.language_code)
    if not voices:
        raise SystemExit(f"No default voice shortlist for {args.language_code}. Use --voice.")

    if args.text is not None:
        text = args.text.strip()
    elif args.text_file is not None:
        text = args.text_file.read_text(encoding="utf-8").strip()
    else:
        text = DEFAULT_TEXT.get(args.language_code, DEFAULT_TEXT["en-US"])

    if not text:
        raise SystemExit("Input text is empty.")

    token = get_access_token(load_credentials(args.credentials))
    args.out_dir.mkdir(parents=True, exist_ok=True)

    items = []
    for index, voice in enumerate(voices, start=1):
        language_code = args.language_code or infer_language_code(voice)
        stem = f"{index:02d}_{voice}"
        ext = "mp3" if args.encoding == "MP3" else args.encoding.lower()
        out = args.out_dir / f"{stem}.{ext}"
        audio = synthesize(
            token=token,
            text=text,
            voice=voice,
            language_code=language_code,
            speaking_rate=args.rate,
            audio_encoding=args.encoding,
            input_kind=args.input_kind,
        )
        out.write_bytes(audio)
        item = {
            "voice": voice,
            "language_code": language_code,
            "rate": args.rate,
            "input_kind": args.input_kind,
            "encoding": args.encoding,
            "text": text,
            "path": str(out),
            "bytes": len(audio),
            "duration_seconds": duration_seconds(out),
        }
        items.append(item)
        print(json.dumps(item, ensure_ascii=False))

    manifest = {
        "role": "google_tts_voice_audition",
        "language_code": args.language_code,
        "input_kind": args.input_kind,
        "rate": args.rate,
        "items": items,
    }
    manifest_path = args.out_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {manifest_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
