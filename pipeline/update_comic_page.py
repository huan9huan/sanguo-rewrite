from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path
import sys
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from pipeline.detect_comic_panels import (
    build_detection_payload,
    detect_panel_boxes,
    load_json as load_json_file,
    write_debug_image,
)
from pipeline.generate_comic_prompt import build_frames_summary, build_page_prompt, load_spec, resolve_path as resolve_spec_path
from pipeline.merge_comic_panel_boxes import merge_layout


def resolve_path(path_str: str | Path) -> Path:
    path = Path(path_str)
    if path.is_absolute():
        return path
    return (ROOT / path).resolve()


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def ensure_workspace_dirs(passage_dir: Path) -> dict[str, Path]:
    dirs = {
        "comic": passage_dir / "comic",
        "current": passage_dir / "current",
    }
    for path in dirs.values():
        path.mkdir(parents=True, exist_ok=True)
    return dirs


def latest_legacy_path(directory: Path, pattern: str) -> Path | None:
    matches = sorted(directory.glob(pattern), key=lambda path: extract_number(path.name))
    return matches[-1] if matches else None


def extract_number(name: str) -> int:
    match = re.search(r"(?:_v|run)(\d+)", name)
    return int(match.group(1)) if match else 0


def next_run_dir(comic_dir: Path) -> Path:
    runs = sorted(
        [path for path in comic_dir.iterdir() if path.is_dir() and re.fullmatch(r"run\d+", path.name)],
        key=lambda path: extract_number(path.name),
    )
    number = extract_number(runs[-1].name) + 1 if runs else 1
    return comic_dir / f"run{number:03d}"


def latest_run_dir(comic_dir: Path) -> Path | None:
    runs = sorted(
        [path for path in comic_dir.iterdir() if path.is_dir() and re.fullmatch(r"run\d+", path.name)],
        key=lambda path: extract_number(path.name),
    )
    return runs[-1] if runs else None


def copy_if_present(source: Path | None, dest: Path) -> bool:
    if not source or not source.exists():
        return False
    if source.resolve() == dest.resolve():
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, dest)
    return True


def current_file(passage_dir: Path, name: str) -> Path:
    return passage_dir / "current" / name


def find_spec_source(passage_dir: Path, explicit: Path | None = None) -> Path:
    if explicit:
        return explicit
    current_spec = current_file(passage_dir, "passage_comic_spec.json")
    if current_spec.exists():
        return current_spec
    legacy = latest_legacy_path(passage_dir, "passage_comic_spec_v*.json")
    if legacy:
        return legacy
    raise FileNotFoundError(f"No comic spec found in {passage_dir}")


def find_layout_source(passage_dir: Path, explicit: Path | None = None, run_dir: Path | None = None) -> Path:
    candidates = []
    if explicit:
        candidates.append(explicit)
    if run_dir:
        candidates.append(run_dir / "base_comic_reader_layout.json")
        candidates.append(run_dir / "comic_reader_layout.json")
    candidates.append(current_file(passage_dir, "comic_reader_layout.json"))
    legacy = latest_legacy_path(passage_dir, "comic_reader_layout_v*.json")
    if legacy:
        candidates.append(legacy)

    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"No comic reader layout found in {passage_dir}")


def find_image_source(passage_dir: Path, run_dir: Path | None = None) -> Path:
    candidates = []
    if run_dir:
        candidates.extend(
            [
                run_dir / "image.png",
                run_dir / "image.jpg",
                run_dir / "image.jpeg",
                run_dir / "image.webp",
            ]
        )
    candidates.extend(
        [
            current_file(passage_dir, "image.png"),
            current_file(passage_dir, "image.jpg"),
            current_file(passage_dir, "image.jpeg"),
            current_file(passage_dir, "image.webp"),
            passage_dir / "image.png",
            passage_dir / "image.jpg",
            passage_dir / "image.jpeg",
            passage_dir / "image.webp",
        ]
    )
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"No image found for {passage_dir}")


def copy_supporting_assets(passage_dir: Path, run_dir: Path, spec_source: Path, layout_source: Path) -> dict[str, bool]:
    copied = {
        "spec_json": copy_if_present(spec_source, run_dir / "passage_comic_spec.json"),
        "layout_base": copy_if_present(layout_source, run_dir / "base_comic_reader_layout.json"),
    }

    spec_md_current = current_file(passage_dir, "passage_comic_spec.md")
    spec_md_legacy = latest_legacy_path(passage_dir, "passage_comic_spec_v*.md")
    copied["spec_md"] = copy_if_present(
        spec_md_current if spec_md_current.exists() else spec_md_legacy,
        run_dir / "passage_comic_spec.md",
    )

    prompt_current = current_file(passage_dir, "page_prompt.txt")
    if prompt_current.exists():
        copied["prompt"] = copy_if_present(prompt_current, run_dir / "page_prompt.txt")
    else:
        latest_generated = sorted(
            [path for path in passage_dir.glob("passage_comic_v*_generated/page_prompt.txt") if path.exists()],
            key=lambda path: extract_number(str(path.parent.name)),
        )
        copied["prompt"] = copy_if_present(latest_generated[-1] if latest_generated else None, run_dir / "page_prompt.txt")

    summary_current = current_file(passage_dir, "frames_summary.json")
    if summary_current.exists():
        copied["summary"] = copy_if_present(summary_current, run_dir / "frames_summary.json")
    else:
        latest_summary = sorted(
            [path for path in passage_dir.glob("passage_comic_v*_generated/frames_summary.json") if path.exists()],
            key=lambda path: extract_number(str(path.parent.name)),
        )
        copied["summary"] = copy_if_present(latest_summary[-1] if latest_summary else None, run_dir / "frames_summary.json")
    return copied


def prepare_prompt(passage_dir: Path, spec_path: Path | None) -> dict[str, str | dict[str, bool]]:
    dirs = ensure_workspace_dirs(passage_dir)
    run_dir = next_run_dir(dirs["comic"])
    run_dir.mkdir(parents=True, exist_ok=True)

    spec_source = find_spec_source(passage_dir, explicit=spec_path)
    layout_source = find_layout_source(passage_dir)
    copied = copy_supporting_assets(passage_dir, run_dir, spec_source, layout_source)

    resolved_spec_path, spec = load_spec(spec_source)
    prompt = build_page_prompt(spec)
    summary = build_frames_summary(spec)

    prompt_path = run_dir / "page_prompt.txt"
    summary_path = run_dir / "frames_summary.json"
    prompt_path.write_text(prompt, encoding="utf-8")
    write_json(summary_path, summary)
    write_json(
        run_dir / "meta.json",
        {
            "mode": "prepare_prompt",
            "source_spec": str(resolved_spec_path),
            "source_layout": str(layout_source),
        },
    )

    return {
        "passage": str(passage_dir),
        "run_dir": str(run_dir),
        "spec": str(resolved_spec_path),
        "prompt_path": str(prompt_path),
        "summary_path": str(summary_path),
        "copied": copied,
    }


def detect_and_merge(run_dir: Path, layout_path: Path, image_path: Path) -> dict[str, str]:
    layout = load_json_file(layout_path)
    expected_count = len(layout.get("frames", []))
    boxes, image = detect_panel_boxes(image_path, expected_count)

    detected_output = run_dir / "comic_panel_boxes.json"
    detection_payload = build_detection_payload(layout, boxes, image_path)
    write_json(detected_output, detection_payload)

    debug_path = run_dir / "comic_panel_boxes_debug.png"
    write_debug_image(image, boxes, debug_path)

    merged_output = run_dir / "comic_reader_layout.json"
    merged = merge_layout(layout, detection_payload)
    merged["version"] = extract_number(run_dir.name)
    write_json(merged_output, merged)

    return {
        "layout_in": str(layout_path),
        "image": str(image_path),
        "detected_output": str(detected_output),
        "debug_image": str(debug_path),
        "layout_out": str(merged_output),
    }


def apply_image(
    passage_dir: Path,
    source_image: Path | None,
    layout_path: Path | None,
    run_path: Path | None,
) -> dict[str, str | dict[str, bool]]:
    dirs = ensure_workspace_dirs(passage_dir)
    run_dir = run_path or latest_run_dir(dirs["comic"]) or next_run_dir(dirs["comic"])
    run_dir.mkdir(parents=True, exist_ok=True)

    resolved_layout = find_layout_source(passage_dir, explicit=layout_path, run_dir=run_dir)
    spec_source = find_spec_source(passage_dir)
    copied = copy_supporting_assets(passage_dir, run_dir, spec_source, resolved_layout)

    target_image = run_dir / "image.png"
    if source_image is not None:
        suffix = source_image.suffix.lower()
        target_image = run_dir / f"image{suffix if suffix in {'.jpg', '.jpeg', '.webp'} else '.png'}"
        shutil.copy2(source_image, target_image)
    else:
        try:
            target_image = find_image_source(passage_dir, run_dir=run_dir)
        except FileNotFoundError:
            existing_image = find_image_source(passage_dir)
            target_image = run_dir / existing_image.name
            shutil.copy2(existing_image, target_image)

    if not target_image.exists():
        target_image = find_image_source(passage_dir, run_dir=run_dir)

    result = detect_and_merge(run_dir=run_dir, layout_path=resolved_layout, image_path=target_image)
    write_json(
        run_dir / "meta.json",
        {
            "mode": "apply_image",
            "source_layout": str(resolved_layout),
            "source_image": str(source_image) if source_image else str(target_image),
        },
    )
    return {
        "passage": str(passage_dir),
        "run_dir": str(run_dir),
        "copied": copied,
        **result,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Comic page workflow using comic/runNNN workspaces and current/ promotion.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    prepare = subparsers.add_parser("prepare-prompt", help="Create the next comic/runNNN workspace with prompt assets.")
    prepare.add_argument("passage", help="Path to a passage directory like story/cp001-p01")
    prepare.add_argument("--spec", help="Optional path to the comic spec JSON. Defaults to current/ then legacy fallback.")

    apply_cmd = subparsers.add_parser(
        "apply-image",
        help="Copy a new image into a run workspace and generate comic boxes + merged layout inside that run.",
    )
    apply_cmd.add_argument("passage", help="Path to a passage directory like story/cp001-p01")
    apply_cmd.add_argument("--from-image", dest="from_image", help="Optional path to a newly generated image.")
    apply_cmd.add_argument("--layout", help="Optional base layout JSON. Defaults to run base, current/, then legacy fallback.")
    apply_cmd.add_argument("--run", help="Optional run directory like story/cp001-p01/comic/run002. Defaults to latest run.")

    refresh = subparsers.add_parser(
        "refresh-boxes",
        help="Re-run detection and merge inside a comic run using its current image or current/image.png fallback.",
    )
    refresh.add_argument("passage", help="Path to a passage directory like story/cp001-p01")
    refresh.add_argument("--layout", help="Optional base layout JSON. Defaults to run base, current/, then legacy fallback.")
    refresh.add_argument("--run", help="Optional run directory like story/cp001-p01/comic/run002. Defaults to latest run.")

    return parser.parse_args()


def main() -> None:
    args = parse_args()
    passage_dir = resolve_path(args.passage)

    if args.command == "prepare-prompt":
        spec_path = resolve_spec_path(args.spec) if args.spec else None
        result = prepare_prompt(passage_dir=passage_dir, spec_path=spec_path)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    if args.command == "apply-image":
        source_image = resolve_path(args.from_image) if args.from_image else None
        layout_path = resolve_path(args.layout) if args.layout else None
        run_path = resolve_path(args.run) if args.run else None
        result = apply_image(
            passage_dir=passage_dir,
            source_image=source_image,
            layout_path=layout_path,
            run_path=run_path,
        )
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    if args.command == "refresh-boxes":
        layout_path = resolve_path(args.layout) if args.layout else None
        run_path = resolve_path(args.run) if args.run else None
        result = apply_image(
            passage_dir=passage_dir,
            source_image=None,
            layout_path=layout_path,
            run_path=run_path,
        )
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return


if __name__ == "__main__":
    main()
