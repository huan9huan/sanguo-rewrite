from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path
from typing import Iterable

from pipeline.image_magick import normalize_comic_png

ROOT = Path(__file__).resolve().parents[1]

CURRENT_FILES = {
    "draft": "draft_cn.md",
    "review": "draft_cn_review.json",
    "approved": "approved_cn.md",
    "comic_spec_json": "comic_spec.json",
    "comic_spec_md": "comic_spec.md",
    "comic_prompt": "comic_prompt.txt",
    "comic_frames": "comic_frames.json",
    "comic_image": "comic.png",
    "comic_boxes": "comic_panel_boxes.json",
    "comic_boxes_debug": "comic_panel_boxes_debug.png",
    "comic_layout": "comic.json",
    "comic_eval": "comic_eval.md",
}


def resolve_path(path_str: str | Path) -> Path:
    path = Path(path_str)
    if path.is_absolute():
        return path
    return (ROOT / path).resolve()


def extract_version(name: str) -> int:
    match = re.search(r"_v(\d+)", name)
    return int(match.group(1)) if match else 0


def latest_match(directory: Path, pattern: str) -> Path | None:
    matches = sorted(directory.glob(pattern), key=lambda path: extract_version(path.name))
    return matches[-1] if matches else None


def ensure_dirs(passage_dir: Path) -> dict[str, Path]:
    dirs = {
        "draft": passage_dir / "draft",
        "comic": passage_dir / "comic",
        "current": passage_dir / "current",
        "published": passage_dir / "published",
    }
    for path in dirs.values():
        path.mkdir(parents=True, exist_ok=True)
    return dirs


def next_numbered_dir(parent: Path, prefix: str) -> Path:
    matches = sorted(
        [path for path in parent.iterdir() if path.is_dir() and re.fullmatch(rf"{re.escape(prefix)}\d+", path.name)],
        key=lambda path: int(path.name[len(prefix):]),
    )
    number = int(matches[-1].name[len(prefix):]) + 1 if matches else 1
    return parent / f"{prefix}{number:03d}"


def copy_if_present(source: Path | None, dest: Path) -> bool:
    if not source or not source.exists():
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, dest)
    return True


def write_meta(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def bootstrap_legacy(passage_dir: Path) -> dict[str, object]:
    dirs = ensure_dirs(passage_dir)
    draft_dir = next_numbered_dir(dirs["draft"], "v")
    comic_dir = next_numbered_dir(dirs["comic"], "run")
    draft_dir.mkdir(parents=True, exist_ok=True)
    comic_dir.mkdir(parents=True, exist_ok=True)

    latest_draft = latest_match(passage_dir, "draft_cn_v*.md")
    latest_review = latest_match(passage_dir, "draft_cn_v*_review.json")
    latest_approved = latest_match(passage_dir, "cp*_cn_v*.md")
    latest_image = next((path for path in [
        passage_dir / "image.png",
        passage_dir / "image.jpg",
        passage_dir / "image.jpeg",
        passage_dir / "image.webp",
    ] if path.exists()), None)
    latest_layout = latest_match(passage_dir, "comic_reader_layout_v*.json")
    latest_boxes = latest_match(passage_dir, "comic_panel_boxes_v*.json")
    latest_boxes_debug = latest_match(passage_dir, "comic_panel_boxes_v*_debug.png")
    latest_spec = latest_match(passage_dir, "passage_comic_spec_v*.json")
    latest_spec_md = latest_match(passage_dir, "passage_comic_spec_v*.md")
    latest_prompt_dir = sorted(
        [path for path in passage_dir.glob("passage_comic_v*_generated") if path.is_dir()],
        key=lambda path: extract_version(path.name),
    )
    latest_prompt = latest_prompt_dir[-1] / "page_prompt.txt" if latest_prompt_dir else None
    latest_summary = latest_prompt_dir[-1] / "frames_summary.json" if latest_prompt_dir else None

    copied_draft = {
        CURRENT_FILES["draft"]: copy_if_present(latest_draft, draft_dir / CURRENT_FILES["draft"]),
        CURRENT_FILES["review"]: copy_if_present(latest_review, draft_dir / CURRENT_FILES["review"]),
        CURRENT_FILES["approved"]: copy_if_present(latest_approved, draft_dir / CURRENT_FILES["approved"]),
    }
    copied_comic = {
        CURRENT_FILES["comic_spec_json"]: copy_if_present(latest_spec, comic_dir / CURRENT_FILES["comic_spec_json"]),
        CURRENT_FILES["comic_spec_md"]: copy_if_present(latest_spec_md, comic_dir / CURRENT_FILES["comic_spec_md"]),
        CURRENT_FILES["comic_prompt"]: copy_if_present(latest_prompt, comic_dir / CURRENT_FILES["comic_prompt"]),
        CURRENT_FILES["comic_frames"]: copy_if_present(latest_summary, comic_dir / CURRENT_FILES["comic_frames"]),
        CURRENT_FILES["comic_image"]: copy_if_present(latest_image, comic_dir / CURRENT_FILES["comic_image"]),
        CURRENT_FILES["comic_boxes"]: copy_if_present(latest_boxes, comic_dir / CURRENT_FILES["comic_boxes"]),
        CURRENT_FILES["comic_boxes_debug"]: copy_if_present(latest_boxes_debug, comic_dir / CURRENT_FILES["comic_boxes_debug"]),
        CURRENT_FILES["comic_layout"]: copy_if_present(latest_layout, comic_dir / CURRENT_FILES["comic_layout"]),
    }

    copy_if_present(draft_dir / CURRENT_FILES["draft"], dirs["current"] / CURRENT_FILES["draft"])
    copy_if_present(draft_dir / CURRENT_FILES["review"], dirs["current"] / CURRENT_FILES["review"])
    copy_if_present(draft_dir / CURRENT_FILES["approved"], dirs["current"] / CURRENT_FILES["approved"])
    copy_if_present(comic_dir / CURRENT_FILES["comic_image"], dirs["current"] / CURRENT_FILES["comic_image"])
    copy_if_present(comic_dir / CURRENT_FILES["comic_layout"], dirs["current"] / CURRENT_FILES["comic_layout"])

    write_meta(
        draft_dir / "meta.json",
        {
            "source": "legacy_top_level",
            "latest_draft": latest_draft.name if latest_draft else None,
            "latest_review": latest_review.name if latest_review else None,
            "latest_approved": latest_approved.name if latest_approved else None,
        },
    )
    write_meta(
        comic_dir / "meta.json",
        {
            "source": "legacy_top_level",
            "latest_spec": latest_spec.name if latest_spec else None,
            "latest_prompt": latest_prompt.name if latest_prompt and latest_prompt.exists() else None,
            "latest_image": latest_image.name if latest_image else None,
            "latest_boxes": latest_boxes.name if latest_boxes else None,
            "latest_layout": latest_layout.name if latest_layout else None,
        },
    )

    return {
        "passage": str(passage_dir),
        "draft_version_dir": str(draft_dir),
        "comic_run_dir": str(comic_dir),
        "current_dir": str(dirs["current"]),
        "copied_draft": copied_draft,
        "copied_comic": copied_comic,
    }


def promote_comic(passage_dir: Path, run_dir: Path) -> dict[str, object]:
    dirs = ensure_dirs(passage_dir)
    mapping = {
        "comic.png": CURRENT_FILES["comic_image"],
        "image.png": CURRENT_FILES["comic_image"],
        "comic.json": CURRENT_FILES["comic_layout"],
        "comic_reader_layout.json": CURRENT_FILES["comic_layout"],
    }
    copied: list[str] = []
    for source_name, dest_name in mapping.items():
        source_path = run_dir / source_name
        dest_path = dirs["current"] / dest_name
        if dest_name == CURRENT_FILES["comic_image"] and source_path.exists():
            normalize_comic_png(source_path, dest_path)
            copied.append(dest_name)
            continue
        if copy_if_present(source_path, dest_path):
            copied.append(dest_name)
    return {
        "passage": str(passage_dir),
        "run_dir": str(run_dir),
        "current_dir": str(dirs["current"]),
        "copied": copied,
    }


def promote_draft(passage_dir: Path, version_dir: Path) -> dict[str, object]:
    dirs = ensure_dirs(passage_dir)
    mapping = {
        CURRENT_FILES["draft"]: CURRENT_FILES["draft"],
        CURRENT_FILES["review"]: CURRENT_FILES["review"],
        CURRENT_FILES["approved"]: CURRENT_FILES["approved"],
    }
    copied: list[str] = []
    for source_name, dest_name in mapping.items():
        if copy_if_present(version_dir / source_name, dirs["current"] / dest_name):
            copied.append(dest_name)
    return {
        "passage": str(passage_dir),
        "version_dir": str(version_dir),
        "current_dir": str(dirs["current"]),
        "copied": copied,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Initialize and promote the new passage workspace structure.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    init_cmd = subparsers.add_parser("init", help="Create draft/comic/current/published directories for a passage.")
    init_cmd.add_argument("passage", help="Path to a passage directory like story/cp001-p01")

    bootstrap_cmd = subparsers.add_parser(
        "bootstrap-legacy",
        help="Snapshot top-level legacy assets into draft/v001, comic/run001, and current/ without deleting legacy files.",
    )
    bootstrap_cmd.add_argument("passage", help="Path to a passage directory like story/cp001-p01")

    promote_comic_cmd = subparsers.add_parser("promote-comic", help="Promote a comic run directory into current/.")
    promote_comic_cmd.add_argument("passage", help="Path to a passage directory like story/cp001-p01")
    promote_comic_cmd.add_argument("run", help="Path to a comic run directory like story/cp001-p01/comic/run001")

    promote_draft_cmd = subparsers.add_parser("promote-draft", help="Promote a draft version directory into current/.")
    promote_draft_cmd.add_argument("passage", help="Path to a passage directory like story/cp001-p01")
    promote_draft_cmd.add_argument("version", help="Path to a draft version directory like story/cp001-p01/draft/v001")

    return parser.parse_args()


def main() -> None:
    args = parse_args()
    passage_dir = resolve_path(args.passage)

    if args.command == "init":
        result = ensure_dirs(passage_dir)
        print(json.dumps({key: str(value) for key, value in result.items()}, ensure_ascii=False, indent=2))
        return

    if args.command == "bootstrap-legacy":
        print(json.dumps(bootstrap_legacy(passage_dir), ensure_ascii=False, indent=2))
        return

    if args.command == "promote-comic":
        run_dir = resolve_path(args.run)
        print(json.dumps(promote_comic(passage_dir, run_dir), ensure_ascii=False, indent=2))
        return

    if args.command == "promote-draft":
        version_dir = resolve_path(args.version)
        print(json.dumps(promote_draft(passage_dir, version_dir), ensure_ascii=False, indent=2))
        return


if __name__ == "__main__":
    main()
