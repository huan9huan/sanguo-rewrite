from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
import re
from typing import Any

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class PanelBox:
    x: float
    y: float
    w: float
    h: float

    def to_json(self) -> dict[str, float]:
        return {
            "x": round(self.x, 4),
            "y": round(self.y, 4),
            "w": round(self.w, 4),
            "h": round(self.h, 4),
        }


@dataclass(frozen=True)
class PixelBox:
    x: int
    y: int
    w: int
    h: int

    @property
    def area(self) -> int:
        return self.w * self.h


def resolve_path(path_str: str | Path) -> Path:
    path = Path(path_str)
    if path.is_absolute():
        return path
    return (ROOT / path).resolve()


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def latest_layout_path(passage_dir: Path) -> Path:
    layouts = sorted(
      passage_dir.glob("comic_reader_layout_v*.json"),
      key=lambda path: int(re.search(r"_v(\d+)\.json$", path.name).group(1)) if re.search(r"_v(\d+)\.json$", path.name) else 0,
    )
    if not layouts:
        raise FileNotFoundError(f"No comic_reader_layout_v*.json found in {passage_dir}")
    return layouts[-1]


def contiguous_ranges(mask: np.ndarray) -> list[tuple[int, int]]:
    ranges: list[tuple[int, int]] = []
    start: int | None = None

    for index, value in enumerate(mask.tolist()):
        if value and start is None:
            start = index
        elif not value and start is not None:
            ranges.append((start, index))
            start = None

    if start is not None:
        ranges.append((start, len(mask)))
    return ranges


def merge_segments(segments: list[tuple[int, int]], target_count: int) -> list[tuple[int, int]]:
    merged = list(segments)
    while len(merged) > target_count and len(merged) > 1:
        heights = [end - start for start, end in merged]
        smallest_index = min(range(len(heights)), key=heights.__getitem__)
        if smallest_index == 0:
            next_start, next_end = merged[1]
            merged[1] = (merged[0][0], next_end)
            del merged[0]
        else:
            prev_start, _prev_end = merged[smallest_index - 1]
            _start, end = merged[smallest_index]
            merged[smallest_index - 1] = (prev_start, end)
            del merged[smallest_index]
    return merged


def split_segments(segments: list[tuple[int, int]], target_count: int) -> list[tuple[int, int]]:
    split = list(segments)
    while len(split) < target_count and split:
        heights = [end - start for start, end in split]
        largest_index = max(range(len(heights)), key=heights.__getitem__)
        start, end = split[largest_index]
        midpoint = start + (end - start) // 2
        if midpoint - start < 24 or end - midpoint < 24:
            break
        split[largest_index:largest_index + 1] = [(start, midpoint), (midpoint, end)]
    return split


def detect_vertical_segments(gray: np.ndarray, expected_count: int) -> list[tuple[int, int]]:
    dark_mask = (gray < 72).astype(np.uint8)
    row_ratio = dark_mask.mean(axis=1)
    kernel = np.ones(15, dtype=np.float32) / 15.0
    smooth_ratio = np.convolve(row_ratio, kernel, mode="same")
    gutter_threshold = max(0.06, float(np.percentile(smooth_ratio, 82)) * 0.72)
    gutter_rows = smooth_ratio > gutter_threshold
    content_rows = ~gutter_rows
    segments = [
        (start, end)
        for start, end in contiguous_ranges(content_rows)
        if end - start >= max(32, int(gray.shape[0] * 0.08))
    ]

    if len(segments) > expected_count:
        segments = merge_segments(segments, expected_count)
    elif len(segments) < expected_count:
        segments = split_segments(segments, expected_count)
    return segments


def detect_horizontal_bounds(gray_segment: np.ndarray) -> tuple[int, int]:
    dark_mask = (gray_segment < 88).astype(np.uint8)
    col_ratio = dark_mask.mean(axis=0)
    kernel = np.ones(9, dtype=np.float32) / 9.0
    smooth_ratio = np.convolve(col_ratio, kernel, mode="same")
    active_threshold = max(0.015, float(np.percentile(smooth_ratio, 80)) * 0.45)
    active = smooth_ratio > active_threshold
    ranges = contiguous_ranges(active)
    if not ranges:
        return 0, gray_segment.shape[1]
    start, end = max(ranges, key=lambda item: item[1] - item[0])
    return start, end


def iou(a: PixelBox, b: PixelBox) -> float:
    left = max(a.x, b.x)
    top = max(a.y, b.y)
    right = min(a.x + a.w, b.x + b.w)
    bottom = min(a.y + a.h, b.y + b.h)
    if right <= left or bottom <= top:
        return 0.0
    intersection = (right - left) * (bottom - top)
    union = a.area + b.area - intersection
    return intersection / union if union else 0.0


def contains(outer: PixelBox, inner: PixelBox) -> bool:
    return (
        outer.x <= inner.x
        and outer.y <= inner.y
        and outer.x + outer.w >= inner.x + inner.w
        and outer.y + outer.h >= inner.y + inner.h
    )


def find_rectangular_boxes(gray: np.ndarray) -> list[PixelBox]:
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 60, 180)
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=1)
    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    height, width = gray.shape
    image_area = height * width
    candidates: list[PixelBox] = []

    for contour in contours:
        perimeter = cv2.arcLength(contour, True)
        if perimeter < 300:
            continue

        approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
        x, y, w, h = cv2.boundingRect(approx)
        area = w * h
        if area < image_area * 0.06 or area > image_area * 0.98:
            continue
        if w < width * 0.25 or h < height * 0.1:
            continue

        rectangularity = cv2.contourArea(contour) / max(area, 1)
        if rectangularity < 0.65:
            continue

        candidates.append(PixelBox(x=x, y=y, w=w, h=h))

    candidates.sort(key=lambda box: box.area, reverse=True)
    deduped: list[PixelBox] = []
    for candidate in candidates:
        if any(contains(existing, candidate) or iou(existing, candidate) > 0.92 for existing in deduped):
            continue
        deduped.append(candidate)

    return sorted(deduped, key=lambda box: (box.y, box.x))


def merge_two_boxes(a: PixelBox, b: PixelBox) -> PixelBox:
    left = min(a.x, b.x)
    top = min(a.y, b.y)
    right = max(a.x + a.w, b.x + b.w)
    bottom = max(a.y + a.h, b.y + b.h)
    return PixelBox(x=left, y=top, w=right - left, h=bottom - top)


def row_key(box: PixelBox) -> tuple[int, int]:
    return (box.y, box.x)


def group_boxes_by_row(boxes: list[PixelBox]) -> list[list[PixelBox]]:
    rows: list[list[PixelBox]] = []
    for box in sorted(boxes, key=row_key):
        placed = False
        for row in rows:
            row_center = sum(item.y + item.h / 2 for item in row) / len(row)
            row_height = sum(item.h for item in row) / len(row)
            box_center = box.y + box.h / 2
            if abs(box_center - row_center) <= max(24, row_height * 0.45):
                row.append(box)
                row.sort(key=lambda item: item.x)
                placed = True
                break
        if not placed:
            rows.append([box])
    return rows


def adjust_box_count(boxes: list[PixelBox], expected_count: int, gray: np.ndarray) -> list[PixelBox]:
    adjusted = list(boxes)
    while len(adjusted) > expected_count:
        rows = group_boxes_by_row(adjusted)
        merge_choice: tuple[int, int, PixelBox] | None = None

        for row_index, row in enumerate(rows):
            if len(row) < 2:
                continue
            for pair_index in range(len(row) - 1):
                merged = merge_two_boxes(row[pair_index], row[pair_index + 1])
                if merge_choice is None:
                    merge_choice = (row_index, pair_index, merged)
                    continue
                current = merge_choice[2]
                if merged.area > current.area:
                    merge_choice = (row_index, pair_index, merged)

        if merge_choice is None:
            smallest_index = min(range(len(adjusted)), key=lambda index: adjusted[index].area)
            del adjusted[smallest_index]
            continue

        row_index, pair_index, merged = merge_choice
        rows[row_index][pair_index:pair_index + 2] = [merged]
        adjusted = [box for row in rows for box in row]

    if len(adjusted) < expected_count:
        segments = detect_vertical_segments(gray, expected_count)
        fallback_boxes: list[PixelBox] = []
        for start, end in segments[:expected_count]:
            left, right = detect_horizontal_bounds(gray[start:end, :])
            fallback_boxes.append(PixelBox(x=left, y=start, w=right - left, h=end - start))
        adjusted = fallback_boxes

    return sorted(adjusted[:expected_count], key=row_key)


def detect_panel_boxes(image_path: Path, expected_count: int) -> tuple[list[PanelBox], np.ndarray]:
    image = cv2.imread(str(image_path))
    if image is None:
        raise FileNotFoundError(f"Unable to read image: {image_path}")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape
    rectangles = find_rectangular_boxes(gray)
    pixel_boxes = adjust_box_count(rectangles, expected_count, gray)

    boxes: list[PanelBox] = []
    for pixel_box in pixel_boxes:
        pad_x = max(6, int(width * 0.006))
        pad_y = max(6, int(height * 0.006))
        x1 = max(0, pixel_box.x - pad_x)
        x2 = min(width, pixel_box.x + pixel_box.w + pad_x)
        y1 = max(0, pixel_box.y - pad_y)
        y2 = min(height, pixel_box.y + pixel_box.h + pad_y)
        boxes.append(
            PanelBox(
                x=x1 / width,
                y=y1 / height,
                w=(x2 - x1) / width,
                h=(y2 - y1) / height,
            )
        )

    return boxes, image


def write_debug_image(image: np.ndarray, boxes: list[PanelBox], output_path: Path) -> None:
    debug = image.copy()
    height, width = debug.shape[:2]
    for index, box in enumerate(boxes, start=1):
        x1 = int(box.x * width)
        y1 = int(box.y * height)
        x2 = int((box.x + box.w) * width)
        y2 = int((box.y + box.h) * height)
        cv2.rectangle(debug, (x1, y1), (x2, y2), (30, 180, 255), 4)
        cv2.putText(
            debug,
            f"f{index}",
            (x1 + 8, min(height - 8, y1 + 28)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (30, 180, 255),
            2,
            cv2.LINE_AA,
        )
    cv2.imwrite(str(output_path), debug)


def build_detection_payload(layout: dict[str, Any], boxes: list[PanelBox], image_path: Path) -> dict[str, Any]:
    frames = layout.get("frames", [])
    return {
        "page_id": layout.get("page_id"),
        "source_image": image_path.name,
        "frame_count": len(frames),
        "detected_count": len(boxes),
        "frames": [
            {
                "frame_id": frame.get("frame_id"),
                "scene_id": frame.get("scene_id"),
                "panel_box": box.to_json(),
            }
            for frame, box in zip(frames, boxes)
        ],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Detect stacked comic panel boxes from a passage page image.")
    parser.add_argument("passage", help="Path to a passage directory like story/cp001-p01")
    parser.add_argument(
        "--output",
        help="Optional output path for comic_panel_boxes_vN.json. Defaults to the next version in the passage directory.",
    )
    parser.add_argument(
        "--debug-image",
        help="Optional output path for a debug overlay image. Defaults to comic_panel_boxes_vN_debug.png next to output.",
    )
    return parser.parse_args()


def next_detection_output_path(passage_dir: Path) -> Path:
    existing = sorted(
        passage_dir.glob("comic_panel_boxes_v*.json"),
        key=lambda path: int(re.search(r"_v(\d+)\.json$", path.name).group(1)) if re.search(r"_v(\d+)\.json$", path.name) else 0,
    )
    version = 1
    if existing:
        match = re.search(r"_v(\d+)\.json$", existing[-1].name)
        version = int(match.group(1)) + 1 if match else 1
    return passage_dir / f"comic_panel_boxes_v{version}.json"


def main() -> None:
    args = parse_args()
    passage_dir = resolve_path(args.passage)
    layout_path = latest_layout_path(passage_dir)
    layout = load_json(layout_path)
    image_path = passage_dir / "image.png"
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    expected_count = len(layout.get("frames", []))
    boxes, image = detect_panel_boxes(image_path, expected_count)
    output_path = resolve_path(args.output) if args.output else next_detection_output_path(passage_dir)
    payload = build_detection_payload(layout, boxes, image_path)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    debug_path = resolve_path(args.debug_image) if args.debug_image else output_path.with_name(
        f"{output_path.stem}_debug.png"
    )
    write_debug_image(image, boxes, debug_path)

    print(
        json.dumps(
            {
                "passage": str(passage_dir),
                "layout": str(layout_path),
                "output": str(output_path),
                "debug_image": str(debug_path),
                "detected_count": len(boxes),
                "expected_count": expected_count,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
