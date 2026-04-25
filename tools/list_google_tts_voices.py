#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tools.google_tts import get_access_token, load_credentials


VOICES_URL = "https://texttospeech.googleapis.com/v1/voices"


def fetch_voices(token: str) -> list[dict[str, Any]]:
    resp = requests.get(
        VOICES_URL,
        headers={"Authorization": f"Bearer {token}"},
        timeout=60,
    )
    if not resp.ok:
        raise RuntimeError(f"HTTP {resp.status_code}: {resp.text}")
    return list(resp.json().get("voices", []))


def voice_family(name: str) -> str:
    if "Chirp3-HD" in name:
        return "Chirp3-HD"
    if "Chirp-HD" in name:
        return "Chirp-HD"
    if "Studio" in name:
        return "Studio"
    if "Neural2" in name:
        return "Neural2"
    if "Wavenet" in name:
        return "Wavenet"
    if "Standard" in name:
        return "Standard"
    return "Other"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="List Google Cloud TTS voices.")
    parser.add_argument("--credentials", type=Path, help="Service account JSON path.")
    parser.add_argument(
        "--language-code",
        action="append",
        help="Filter by BCP-47 language code. Can be repeated.",
    )
    parser.add_argument(
        "--family",
        action="append",
        help="Filter by family substring, e.g. Chirp3-HD, Studio, Neural2, Wavenet.",
    )
    parser.add_argument("--json", action="store_true", help="Print JSON instead of a table.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    token = get_access_token(load_credentials(args.credentials))
    voices = fetch_voices(token)

    if args.language_code:
        wanted = set(args.language_code)
        voices = [
            voice
            for voice in voices
            if wanted.intersection(set(voice.get("languageCodes", [])))
        ]

    if args.family:
        families = tuple(args.family)
        voices = [voice for voice in voices if any(f in voice["name"] for f in families)]

    rows = [
        {
            "name": voice["name"],
            "language_codes": voice.get("languageCodes", []),
            "gender": voice.get("ssmlGender"),
            "sample_rate_hz": voice.get("naturalSampleRateHertz"),
            "family": voice_family(voice["name"]),
        }
        for voice in sorted(voices, key=lambda item: item["name"])
    ]

    if args.json:
        print(json.dumps(rows, ensure_ascii=False, indent=2))
        return 0

    for row in rows:
        print(
            "\t".join(
                [
                    row["name"],
                    ",".join(row["language_codes"]),
                    str(row["gender"]),
                    str(row["sample_rate_hz"]),
                    row["family"],
                ]
            )
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
