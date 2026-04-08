from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
from typing import Any

ROOT = Path(__file__).resolve().parents[1]


def resolve_path(path_str: str | Path) -> Path:
    path = Path(path_str)
    if path.is_absolute():
        return path
    return (ROOT / path).resolve()


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def extract_version(path: Path, prefix: str) -> int:
    match = re.search(rf"{re.escape(prefix)}_v(\d+)\.json$", path.name)
    return int(match.group(1)) if match else 0


def latest_path(passage_dir: Path, prefix: str) -> Path:
    matches = sorted(passage_dir.glob(f"{prefix}_v*.json"), key=lambda path: extract_version(path, prefix))
    if not matches:
        raise FileNotFoundError(f"No {prefix}_v*.json found in {passage_dir}")
    return matches[-1]


def next_layout_path(layout_path: Path) -> Path:
    version_match = re.search(r"_v(\d+)\.json$", layout_path.name)
    if not version_match:
        raise ValueError(f"Could not parse layout version from {layout_path.name}")
    next_version = int(version_match.group(1)) + 1
    return layout_path.with_name(re.sub(r"_v\d+\.json$", f"_v{next_version}.json", layout_path.name))


def merge_layout(layout: dict[str, Any], detected: dict[str, Any]) -> dict[str, Any]:
    detected_by_frame = {
        frame.get("frame_id"): frame.get("panel_box")
        for frame in detected.get("frames", [])
        if frame.get("frame_id") and frame.get("panel_box")
    }

    merged_frames: list[dict[str, Any]] = []
    for frame in layout.get("frames", []):
        merged = dict(frame)
        panel_box = detected_by_frame.get(frame.get("frame_id"))
        if panel_box:
          merged["panel_box"] = panel_box
        merged_frames.append(merged)

    merged_layout = dict(layout)
    merged_layout["frames"] = merged_frames
    merged_layout["panel_detection"] = {
        "source": Path(str(detected.get("source_image", ""))).name,
        "frame_count": detected.get("frame_count"),
        "detected_count": detected.get("detected_count"),
    }
    return merged_layout


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Merge detected panel boxes into the next comic_reader_layout version.")
    parser.add_argument("passage", help="Path to a passage directory like story/cp001-p01")
    parser.add_argument("--detected", help="Optional path to comic_panel_boxes_vN.json. Defaults to latest in passage.")
    parser.add_argument("--layout", help="Optional path to comic_reader_layout_vN.json. Defaults to latest in passage.")
    parser.add_argument("--output", help="Optional output path. Defaults to next comic_reader_layout version.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    passage_dir = resolve_path(args.passage)
    detected_path = resolve_path(args.detected) if args.detected else latest_path(passage_dir, "comic_panel_boxes")
    layout_path = resolve_path(args.layout) if args.layout else latest_path(passage_dir, "comic_reader_layout")
    output_path = resolve_path(args.output) if args.output else next_layout_path(layout_path)

    detected = load_json(detected_path)
    layout = load_json(layout_path)
    merged = merge_layout(layout, detected)
    merged["version"] = extract_version(output_path, "comic_reader_layout")
    output_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")

    print(
        json.dumps(
            {
                "passage": str(passage_dir),
                "detected": str(detected_path),
                "layout": str(layout_path),
                "output": str(output_path),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
