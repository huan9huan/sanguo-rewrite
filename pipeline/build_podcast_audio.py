from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
GOOGLE_TTS = ROOT / "tools" / "google_tts.py"


def rel(path: Path) -> str:
    try:
        return path.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def run_checked(cmd: list[str], *, quiet: bool = False) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        cmd,
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE if quiet else None,
        stderr=subprocess.PIPE,
        check=True,
    )


def duration_ms(path: Path) -> int:
    proc = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )
    return round(float(proc.stdout.strip()) * 1000)


def silence_file(path: Path, ms: int) -> None:
    if ms <= 0 or path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    run_checked(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "lavfi",
            "-i",
            "anullsrc=r=44100:cl=mono",
            "-t",
            f"{ms / 1000:.3f}",
            "-codec:a",
            "libmp3lame",
            "-q:a",
            "9",
            str(path),
        ],
        quiet=True,
    )


def voice_for(line: dict[str, Any], voices: dict[str, Any]) -> dict[str, Any]:
    speaker = line["speaker"]
    if speaker not in voices:
        raise SystemExit(f"Missing voice config for speaker: {speaker}")
    return voices[speaker]


def write_subtitles(path: Path, lines: list[dict[str, Any]]) -> None:
    payload = [
        {
            "id": line["id"],
            "speaker": line["speaker"],
            "text": line["text"],
            "start_ms": line["start_ms"],
            "end_ms": line["pause_end_ms"],
        }
        for line in lines
    ]
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build(args: argparse.Namespace) -> int:
    run_dir = Path(args.run).resolve()
    lang = args.lang
    episode_path = run_dir / f"episode_{lang}.json"
    if not episode_path.exists():
        raise SystemExit(f"Missing episode JSON: {episode_path}")

    episode = json.loads(episode_path.read_text(encoding="utf-8"))
    voices_path = run_dir / f"voice_cast_{lang}.json"
    voices = (
        json.loads(voices_path.read_text(encoding="utf-8"))
        if voices_path.exists()
        else episode["voices"]
    )

    audio_dir = run_dir / f"audio_lines_{lang}"
    silence_dir = run_dir / "silence"
    output_dir = run_dir / "output"
    audio_dir.mkdir(parents=True, exist_ok=True)
    silence_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)

    for ms in sorted({int(line["pause_after_ms"]) for line in episode["lines"] if int(line["pause_after_ms"]) > 0}):
        silence_file(silence_dir / f"silence_{ms}ms.mp3", ms)

    audio_manifest_lines: list[dict[str, Any]] = []
    timeline_lines: list[dict[str, Any]] = []
    concat_entries: list[Path] = []
    cursor = 0

    for index, line in enumerate(episode["lines"], start=1):
        cfg = voice_for(line, voices)
        line_id = line["id"]
        out = audio_dir / f"{line_id}.mp3"
        tts_text = line.get("tts_text") or line["text"]

        if args.force or not out.exists():
            cmd = [
                sys.executable,
                str(GOOGLE_TTS),
                "--text",
                tts_text,
                "--voice",
                cfg["voice"],
                "--language-code",
                cfg.get("language_code") or episode["language"],
                "--rate",
                str(cfg["rate"]),
                "--input-kind",
                args.input_kind,
                "--encoding",
                "MP3",
                "--out",
                str(out),
            ]
            print(f"[{index:02d}/{len(episode['lines']):02d}] synthesize {line_id}")
            run_checked(cmd)
        else:
            print(f"[{index:02d}/{len(episode['lines']):02d}] reuse {line_id}")

        line_duration = duration_ms(out)
        pause_ms = int(line["pause_after_ms"])
        segment = {
            "id": line_id,
            "speaker": line["speaker"],
            "text": line["text"],
            "voice": cfg["voice"],
            "language_code": cfg.get("language_code") or episode["language"],
            "rate": cfg["rate"],
            "file": rel(out),
            "duration_ms": line_duration,
            "pause_after_ms": pause_ms,
        }
        if line.get("pronunciation_note"):
            segment["pronunciation_note"] = line["pronunciation_note"]

        timeline_line = {
            "id": line_id,
            "speaker": line["speaker"],
            "text": line["text"],
            "frame_id": line.get("frame_id"),
            "visual_anchor": line.get("visual_anchor", "none"),
            "start_ms": cursor,
            "end_ms": cursor + line_duration,
            "pause_end_ms": cursor + line_duration + pause_ms,
        }
        audio_manifest_lines.append(segment)
        timeline_lines.append(timeline_line)
        concat_entries.append(out)
        if pause_ms > 0:
            concat_entries.append(silence_dir / f"silence_{pause_ms}ms.mp3")
        cursor = timeline_line["pause_end_ms"]

    concat_path = run_dir / f"concat_list_{lang}.txt"
    concat_path.write_text(
        "".join(f"file '{path.as_posix()}'\n" for path in concat_entries),
        encoding="utf-8",
    )

    output_file = output_dir / f"episode_{lang}.mp3"
    run_checked(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_path),
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "128k",
            str(output_file),
        ],
        quiet=True,
    )
    total_ms = duration_ms(output_file)

    audio_manifest = {
        "episode_id": episode["episode_id"],
        "language": episode["language"],
        "input_kind": args.input_kind,
        "encoding": "MP3",
        "engine": "google-cloud-text-to-speech",
        "source_episode": rel(episode_path),
        "output_file": rel(output_file),
        "duration_ms": total_ms,
        "voices": voices,
        "pause_strategy": "pause_after_ms rendered with generated silence files",
        "lines": audio_manifest_lines,
    }
    (run_dir / f"audio_manifest_{lang}.json").write_text(
        json.dumps(audio_manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    timeline = {
        "episode_id": episode["episode_id"],
        "language": episode["language"],
        "mode": episode["mode"],
        "source_episode": rel(episode_path),
        "output_file": rel(output_file),
        "duration_ms": total_ms,
        "lines": timeline_lines,
    }
    (run_dir / f"timeline_{lang}.json").write_text(
        json.dumps(timeline, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_subtitles(run_dir / f"subtitles_{lang}.json", timeline_lines)

    print(json.dumps({"output": rel(output_file), "duration_ms": total_ms}, ensure_ascii=False, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build podcast audio from episode_<lang>.json.")
    parser.add_argument("--run", required=True, help="Podcast run directory.")
    parser.add_argument("--lang", default="en", choices=["en", "zh"], help="Episode language suffix.")
    parser.add_argument("--input-kind", default="text", choices=["text", "ssml", "markup"])
    parser.add_argument("--force", action="store_true", help="Regenerate existing per-line audio.")
    return parser


def main() -> int:
    return build(build_parser().parse_args())


if __name__ == "__main__":
    raise SystemExit(main())
