#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import cv2

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from pipeline.detect_comic_panels import detect_panel_boxes, write_debug_image  # noqa: E402


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Extract ordered comic frames from a page image.")
    parser.add_argument("--image", required=True, help="Input page image path.")
    parser.add_argument("--comic-spec", required=True, help="Comic spec JSON path with a panels array.")
    parser.add_argument("--output-dir", required=True, help="Directory for cropped frames.")
    parser.add_argument("--debug-image", help="Optional debug overlay image path.")
    parser.add_argument("--manifest", help="Optional manifest path. Defaults to output-dir/frames.json")
    return parser


def sanitize_token(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]+", "_", value).strip("_") or "frame"


def main() -> int:
    args = build_parser().parse_args()
    image_path = Path(args.image)
    spec_path = Path(args.comic_spec)
    output_dir = Path(args.output_dir)

    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    panels = spec.get("panels", [])
    if not panels:
        raise ValueError(f"No panels found in comic spec: {spec_path}")

    boxes, image = detect_panel_boxes(image_path, len(panels))
    height, width = image.shape[:2]
    output_dir.mkdir(parents=True, exist_ok=True)

    frames: list[dict[str, object]] = []
    for index, (panel, box) in enumerate(zip(panels, boxes), start=1):
        panel_id = panel.get("panel_id") or panel.get("frame_id") or f"f{index}"
        x1 = max(0, int(box.x * width))
        y1 = max(0, int(box.y * height))
        x2 = min(width, int((box.x + box.w) * width))
        y2 = min(height, int((box.y + box.h) * height))
        crop = image[y1:y2, x1:x2]
        filename = f"{index:02d}-{sanitize_token(str(panel_id))}.png"
        frame_path = output_dir / filename
        cv2.imwrite(str(frame_path), crop)
        frames.append(
            {
                "index": index,
                "panel_id": panel_id,
                "output": str(frame_path),
                "panel_box": box.to_json(),
                "pixel_box": {"x": x1, "y": y1, "w": x2 - x1, "h": y2 - y1},
            }
        )

    debug_path = Path(args.debug_image) if args.debug_image else output_dir / "frames_debug.png"
    write_debug_image(image, boxes, debug_path)

    manifest = {
        "source_image": str(image_path),
        "comic_spec": str(spec_path),
        "frame_count": len(frames),
        "frames": frames,
        "debug_image": str(debug_path),
    }
    manifest_path = Path(args.manifest) if args.manifest else output_dir / "frames.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps({"output_dir": str(output_dir), "manifest": str(manifest_path), "frame_count": len(frames)}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
