from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


DEFAULT_EN_VOICES = {
    "narrator": {
        "voice": "en-US-Chirp3-HD-Charon",
        "rate": 0.94,
        "language_code": "en-US",
    },
    "listener": {
        "voice": "en-US-Chirp3-HD-Iapetus",
        "rate": 1.0,
        "language_code": "en-US",
    },
}

DEFAULT_ZH_VOICES = {
    "narrator": {
        "voice": "cmn-CN-Chirp3-HD-Kore",
        "rate": 1.16,
        "language_code": "cmn-CN",
    },
    "listener": {
        "voice": "cmn-CN-Chirp3-HD-Iapetus",
        "rate": 1.12,
        "language_code": "cmn-CN",
    },
}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def rel(path: Path) -> str:
    try:
        return path.relative_to(Path.cwd()).as_posix()
    except ValueError:
        return path.as_posix()


def next_run_dir(passage: Path) -> Path:
    podcast_dir = passage / "podcast"
    podcast_dir.mkdir(parents=True, exist_ok=True)
    existing = []
    for child in podcast_dir.iterdir():
        if child.is_dir() and child.name.startswith("run"):
            suffix = child.name[3:]
            if suffix.isdigit():
                existing.append(int(suffix))
    n = max(existing, default=0) + 1
    return podcast_dir / f"run{n:03d}"


def source_entry(path: Path) -> dict[str, str]:
    return {"path": rel(path), "sha256": sha256_file(path)}


def build_source_manifest(passage: Path, *, lang: str, comic_sync: bool) -> dict[str, Any]:
    current = passage / "current"
    approved_cn = current / "approved_cn.md"
    if not approved_cn.exists():
        raise SystemExit(f"Missing required source: {approved_cn}")

    source: dict[str, Any] = {"approved_cn": source_entry(approved_cn)}

    if lang == "en":
        approved_en = current / "approved_en.md"
        if approved_en.exists():
            source["approved_en"] = source_entry(approved_en)

    if comic_sync:
        comic_json = current / "comic.json"
        if not comic_json.exists():
            raise SystemExit(f"Comic sync requested, but missing: {comic_json}")
        source["comic_json"] = source_entry(comic_json)

        comic_alignment = current / "comic_alignment.json"
        if comic_alignment.exists():
            source["comic_alignment"] = source_entry(comic_alignment)

    return {
        "source_passage": rel(passage),
        "language": lang,
        "mode": "comic_synced_podcast" if comic_sync else "two_host_story_podcast",
        "source": source,
    }


def init_run(args: argparse.Namespace) -> int:
    passage = Path(args.passage)
    if not passage.exists():
        raise SystemExit(f"Passage does not exist: {passage}")

    run_dir = next_run_dir(passage)
    run_dir.mkdir(parents=True)
    (run_dir / "audio_lines").mkdir()
    (run_dir / "output").mkdir()

    manifest = build_source_manifest(passage, lang=args.lang, comic_sync=args.comic_sync)
    (run_dir / "source_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    default_voices = {"en": DEFAULT_EN_VOICES, "zh": DEFAULT_ZH_VOICES}[args.lang]
    (run_dir / f"voice_cast_{args.lang}.json").write_text(
        json.dumps(default_voices, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    if args.lang == "zh":
        (run_dir / "script_zh.md").write_text(
            "# 中文播客脚本\n\n待写。\n",
            encoding="utf-8",
        )

    print(json.dumps({"run_dir": rel(run_dir)}, ensure_ascii=False))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage podcast passage workspaces.")
    sub = parser.add_subparsers(dest="command", required=True)

    init = sub.add_parser("init-run", help="Create the next podcast run for a passage.")
    init.add_argument("passage", help="Passage path, such as story/cp001-p01.")
    init.add_argument("--lang", default="en", choices=["en", "zh"], help="Podcast language.")
    init.add_argument(
        "--comic-sync",
        action="store_true",
        help="Require current comic metadata and set mode to comic_synced_podcast.",
    )
    init.set_defaults(func=init_run)

    return parser


def main() -> int:
    args = build_parser().parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
