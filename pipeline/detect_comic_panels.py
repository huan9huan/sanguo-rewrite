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

    @property
    def right(self) -> float:
        return self.x + self.w

    @property
    def bottom(self) -> float:
        return self.y + self.h


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


def smooth_signal(values: np.ndarray, window: int) -> np.ndarray:
    if window <= 1:
        return values.astype(np.float32)
    kernel = np.ones(window, dtype=np.float32) / float(window)
    return np.convolve(values.astype(np.float32), kernel, mode="same")


def detect_content_ranges_from_whitespace(
    white_ratio: np.ndarray,
    threshold: float,
    min_separator: int,
    min_content: int,
) -> list[tuple[int, int]]:
    whitespace = white_ratio >= threshold
    separators = [
        (start, end)
        for start, end in contiguous_ranges(whitespace)
        if end - start >= min_separator
    ]

    content_ranges: list[tuple[int, int]] = []
    cursor = 0
    for start, end in separators:
        if start - cursor >= min_content:
            content_ranges.append((cursor, start))
        cursor = end
    if len(white_ratio) - cursor >= min_content:
        content_ranges.append((cursor, len(white_ratio)))
    return content_ranges


def expand_to_nonwhite_bounds(
    gray: np.ndarray,
    top: int,
    bottom: int,
    left: int,
    right: int,
    white_threshold: int,
) -> tuple[int, int, int, int]:
    region = gray[top:bottom, left:right]
    if region.size == 0:
        return left, right, top, bottom

    content_mask = region < white_threshold
    coords = np.argwhere(content_mask)
    if coords.size == 0:
        return left, right, top, bottom

    y1, x1 = coords.min(axis=0)
    y2, x2 = coords.max(axis=0)
    return left + int(x1), left + int(x2) + 1, top + int(y1), top + int(y2) + 1


def detect_whitespace_split_boxes(gray: np.ndarray, expected_count: int) -> list[PixelBox]:
    height, width = gray.shape
    white_bar_size = 5
    white_threshold = 245
    min_row_content = max(24, int(height * 0.045))
    min_col_content = max(24, int(width * 0.18))

    white_mask = (gray >= white_threshold).astype(np.uint8)

    row_white_ratio = smooth_signal(white_mask.mean(axis=1), white_bar_size)
    row_ranges = detect_content_ranges_from_whitespace(
        row_white_ratio,
        threshold=0.985,
        min_separator=white_bar_size,
        min_content=min_row_content,
    )

    boxes: list[PixelBox] = []
    for row_start, row_end in row_ranges:
        row_mask = white_mask[row_start:row_end, :]
        col_white_ratio = smooth_signal(row_mask.mean(axis=0), white_bar_size)
        col_ranges = detect_content_ranges_from_whitespace(
            col_white_ratio,
            threshold=0.985,
            min_separator=white_bar_size,
            min_content=min_col_content,
        )

        if len(col_ranges) <= 1:
            left, right, top, bottom = expand_to_nonwhite_bounds(
                gray,
                row_start,
                row_end,
                0,
                width,
                white_threshold=white_threshold,
            )
            boxes.append(PixelBox(x=left, y=top, w=right - left, h=bottom - top))
            continue

        for col_start, col_end in col_ranges:
            left, right, top, bottom = expand_to_nonwhite_bounds(
                gray,
                row_start,
                row_end,
                col_start,
                col_end,
                white_threshold=white_threshold,
            )
            boxes.append(PixelBox(x=left, y=top, w=right - left, h=bottom - top))

    boxes = [box for box in boxes if box.w >= min_col_content * 0.6 and box.h >= min_row_content * 0.6]
    return sorted(boxes, key=row_key) if len(boxes) == expected_count else []


def row_structure_from_layout(layout: dict[str, Any], expected_count: int) -> list[int]:
    pattern = str(layout.get("layout_pattern", "")).strip().lower()
    if not pattern:
        return []

    row_structure: list[int] = []
    for part in [item.strip() for item in pattern.split("/") if item.strip()]:
        if "three" in part:
            row_structure.append(3)
        elif "two" in part:
            row_structure.append(2)
        else:
            row_structure.append(1)

    return row_structure if sum(row_structure) == expected_count else []


def detect_guided_whitespace_boxes(gray: np.ndarray, row_structure: list[int]) -> list[PixelBox]:
    if not row_structure:
        return []

    height, width = gray.shape
    row_band = smooth_signal(gray.mean(axis=1), 5)
    row_count = len(row_structure)
    search_margin_y = max(20, int(height * 0.06))

    horizontal_boundaries: list[int] = []
    for index in range(1, row_count):
        expected = int(round(height * index / row_count))
        boundary = fit_whitespace_boundary(
            lambda y: float(row_band[y]),
            expected,
            clamp(expected - search_margin_y, 0, height - 1),
            clamp(expected + search_margin_y, 0, height - 1),
        )
        horizontal_boundaries.append(boundary)

    row_ranges: list[tuple[int, int]] = []
    previous = 0
    for boundary in horizontal_boundaries:
        row_ranges.append((previous, boundary))
        previous = boundary
    row_ranges.append((previous, height))

    boxes: list[PixelBox] = []
    for row_index, column_count in enumerate(row_structure):
        top, bottom = row_ranges[row_index]
        if bottom <= top + 8:
            return []

        if column_count == 1:
            boxes.append(PixelBox(x=0, y=top, w=width, h=bottom - top))
            continue

        col_band = smooth_signal(gray[top:bottom, :].mean(axis=0), 5)
        search_margin_x = max(20, int(width * 0.12))
        vertical_boundaries: list[int] = []
        for column_index in range(1, column_count):
            expected = int(round(width * column_index / column_count))
            boundary = fit_whitespace_boundary(
                lambda x: float(col_band[x]),
                expected,
                clamp(expected - search_margin_x, 0, width - 1),
                clamp(expected + search_margin_x, 0, width - 1),
            )
            vertical_boundaries.append(boundary)

        previous_x = 0
        for boundary in vertical_boundaries:
            if boundary <= previous_x + 8:
                return []
            boxes.append(PixelBox(x=previous_x, y=top, w=boundary - previous_x, h=bottom - top))
            previous_x = boundary
        boxes.append(PixelBox(x=previous_x, y=top, w=width - previous_x, h=bottom - top))

    return sorted(boxes, key=row_key)


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


def clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def pixel_box_from_panel(box: PanelBox, width: int, height: int) -> PixelBox:
    x = int(round(box.x * width))
    y = int(round(box.y * height))
    w = int(round(box.w * width))
    h = int(round(box.h * height))
    return PixelBox(x=x, y=y, w=w, h=h)


def panel_box_from_pixel(box: PixelBox, width: int, height: int) -> PanelBox:
    return PanelBox(
        x=box.x / width,
        y=box.y / height,
        w=box.w / width,
        h=box.h / height,
    )


def edge_row_score(edges: np.ndarray, y: int, left: int, right: int) -> float:
    band = edges[max(0, y - 1):min(edges.shape[0], y + 2), left:right]
    return float(band.mean()) if band.size else 0.0


def edge_col_score(edges: np.ndarray, x: int, top: int, bottom: int) -> float:
    band = edges[top:bottom, max(0, x - 1):min(edges.shape[1], x + 2)]
    return float(band.mean()) if band.size else 0.0


def fit_boundary(score_fn, expected: int, search_start: int, search_end: int, threshold: float) -> int:
    best_index = expected
    best_score = -1.0
    for index in range(search_start, search_end + 1):
        score = score_fn(index)
        adjusted = score - abs(index - expected) * 0.15
        if adjusted > best_score:
            best_score = adjusted
            best_index = index
    return best_index if best_score >= threshold else expected


def fit_box_to_template(gray: np.ndarray, prior: PanelBox) -> PanelBox:
    height, width = gray.shape
    edges = cv2.Canny(cv2.GaussianBlur(gray, (5, 5), 0), 60, 180)
    prior_px = pixel_box_from_panel(prior, width, height)

    margin_x = max(10, int(width * 0.02))
    margin_y = max(10, int(height * 0.02))
    left_guess = prior_px.x
    right_guess = prior_px.x + prior_px.w
    top_guess = prior_px.y
    bottom_guess = prior_px.y + prior_px.h

    left = fit_boundary(
        lambda x: edge_col_score(edges, x, clamp(top_guess, 0, height), clamp(bottom_guess, 0, height)),
        left_guess,
        clamp(left_guess - margin_x, 0, width - 1),
        clamp(left_guess + margin_x, 0, width - 1),
        18.0,
    )
    right = fit_boundary(
        lambda x: edge_col_score(edges, x, clamp(top_guess, 0, height), clamp(bottom_guess, 0, height)),
        right_guess,
        clamp(right_guess - margin_x, 0, width - 1),
        clamp(right_guess + margin_x, 0, width - 1),
        18.0,
    )
    top = fit_boundary(
        lambda y: edge_row_score(edges, y, clamp(left_guess, 0, width), clamp(right_guess, 0, width)),
        top_guess,
        clamp(top_guess - margin_y, 0, height - 1),
        clamp(top_guess + margin_y, 0, height - 1),
        18.0,
    )
    bottom = fit_boundary(
        lambda y: edge_row_score(edges, y, clamp(left_guess, 0, width), clamp(right_guess, 0, width)),
        bottom_guess,
        clamp(bottom_guess - margin_y, 0, height - 1),
        clamp(bottom_guess + margin_y, 0, height - 1),
        18.0,
    )

    if right <= left + 24:
        left, right = left_guess, right_guess
    if bottom <= top + 24:
        top, bottom = top_guess, bottom_guess

    fitted = PixelBox(x=left, y=top, w=right - left, h=bottom - top)
    area_ratio = fitted.area / max(prior_px.area, 1)
    if area_ratio < 0.7 or area_ratio > 1.3:
        fitted = prior_px

    return panel_box_from_pixel(fitted, width, height)


def template_boxes_from_layout(layout: dict[str, Any]) -> list[PanelBox]:
    boxes: list[PanelBox] = []
    for frame in layout.get("frames", []):
        panel_box = frame.get("panel_box")
        if not panel_box:
            return []
        boxes.append(
            PanelBox(
                x=float(panel_box.get("x", 0.0)),
                y=float(panel_box.get("y", 0.0)),
                w=float(panel_box.get("w", 0.0)),
                h=float(panel_box.get("h", 0.0)),
            )
        )
    return boxes


def validate_template_pattern(boxes: list[PanelBox], layout_pattern: str) -> bool:
    if len(boxes) != 4:
        return False
    if "top-wide / middle-two / bottom-wide" not in layout_pattern:
        return True
    f1, f2, f3, f4 = boxes
    return (
        f1.w > 0.75
        and f4.w > 0.75
        and abs(f2.y - f3.y) < 0.04
        and abs(f2.h - f3.h) < 0.08
        and f2.w > 0.25
        and f3.w > 0.25
        and f2.right <= f3.x + 0.06
        and f1.bottom <= f2.y + 0.04
        and f2.bottom <= f4.y + 0.06
    )


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


def group_panel_boxes_by_row(boxes: list[PanelBox]) -> list[list[PanelBox]]:
    rows: list[list[PanelBox]] = []
    for box in sorted(boxes, key=lambda item: (item.y, item.x)):
        placed = False
        for row in rows:
            row_center = sum(item.y + item.h / 2 for item in row) / len(row)
            row_height = sum(item.h for item in row) / len(row)
            box_center = box.y + box.h / 2
            if abs(box_center - row_center) <= max(0.035, row_height * 0.45):
                row.append(box)
                row.sort(key=lambda item: item.x)
                placed = True
                break
        if not placed:
            rows.append([box])
    return rows


def normalize_panel_boxes(boxes: list[PanelBox]) -> list[PanelBox]:
    if not boxes:
        return boxes

    rows = group_panel_boxes_by_row(boxes)
    row_bounds = [
        {
            "top": min(box.y for box in row),
            "bottom": max(box.bottom for box in row),
        }
        for row in rows
    ]

    for index in range(len(row_bounds) - 1):
        midpoint = (row_bounds[index]["bottom"] + row_bounds[index + 1]["top"]) / 2
        row_bounds[index]["bottom"] = midpoint
        row_bounds[index + 1]["top"] = midpoint

    normalized_rows: list[list[PanelBox]] = []
    for row_index, row in enumerate(rows):
        top = max(0.0, row_bounds[row_index]["top"])
        bottom = min(1.0, row_bounds[row_index]["bottom"])
        ordered = sorted(row, key=lambda item: item.x)

        segments = [[box.x, box.right] for box in ordered]
        for index in range(len(segments) - 1):
            midpoint = (segments[index][1] + segments[index + 1][0]) / 2
            segments[index][1] = midpoint
            segments[index + 1][0] = midpoint

        normalized_row = [
            PanelBox(
                x=max(0.0, left),
                y=top,
                w=max(0.0, min(1.0, right) - max(0.0, left)),
                h=max(0.0, bottom - top),
            )
            for left, right in segments
        ]
        normalized_rows.append(normalized_row)

    return [box for row in normalized_rows for box in row]


def whitespace_row_score(gray: np.ndarray, y: int, left: int, right: int, band_size: int = 5) -> float:
    half = band_size // 2
    band = gray[max(0, y - half):min(gray.shape[0], y + half + 1), left:right]
    return float(band.mean()) if band.size else 0.0


def whitespace_col_score(gray: np.ndarray, x: int, top: int, bottom: int, band_size: int = 5) -> float:
    half = band_size // 2
    band = gray[top:bottom, max(0, x - half):min(gray.shape[1], x + half + 1)]
    return float(band.mean()) if band.size else 0.0


def fit_whitespace_boundary(score_fn, expected: int, search_start: int, search_end: int) -> int:
    best_index = expected
    best_score = float("-inf")
    for index in range(search_start, search_end + 1):
        score = score_fn(index) - abs(index - expected) * 0.35
        if score > best_score:
            best_score = score
            best_index = index
    return best_index


def fit_boxes_to_whitespace_template(gray: np.ndarray, template_boxes: list[PanelBox]) -> list[PanelBox]:
    if not template_boxes:
        return []

    height, width = gray.shape
    rows = group_panel_boxes_by_row(template_boxes)
    pixel_rows: list[list[PixelBox]] = []
    for row in rows:
        pixel_rows.append([pixel_box_from_panel(box, width, height) for box in row])

    horizontal_boundaries: list[int] = []
    search_margin_y = max(8, int(height * 0.05))
    for index in range(len(pixel_rows) - 1):
        upper_bottom = max(box.y + box.h for box in pixel_rows[index])
        lower_top = min(box.y for box in pixel_rows[index + 1])
        expected = (upper_bottom + lower_top) // 2
        boundary = fit_whitespace_boundary(
            lambda y: whitespace_row_score(gray, y, 0, width),
            expected,
            clamp(expected - search_margin_y, 0, height - 1),
            clamp(expected + search_margin_y, 0, height - 1),
        )
        horizontal_boundaries.append(boundary)

    row_ranges: list[tuple[int, int]] = []
    previous = 0
    for boundary in horizontal_boundaries:
        row_ranges.append((previous, boundary))
        previous = boundary
    row_ranges.append((previous, height))

    fitted: list[PanelBox] = []
    search_margin_x = max(8, int(width * 0.05))
    for row_index, template_row in enumerate(pixel_rows):
        top, bottom = row_ranges[row_index]
        top = clamp(top, 0, height - 1)
        bottom = clamp(bottom, top + 1, height)

        if len(template_row) == 1:
            fitted.append(panel_box_from_pixel(PixelBox(x=0, y=top, w=width, h=bottom - top), width, height))
            continue

        vertical_boundaries: list[int] = []
        ordered = sorted(template_row, key=lambda box: box.x)
        for column_index in range(len(ordered) - 1):
            left_right = ordered[column_index].x + ordered[column_index].w
            right_left = ordered[column_index + 1].x
            expected = (left_right + right_left) // 2
            boundary = fit_whitespace_boundary(
                lambda x: whitespace_col_score(gray, x, top, bottom),
                expected,
                clamp(expected - search_margin_x, 0, width - 1),
                clamp(expected + search_margin_x, 0, width - 1),
            )
            vertical_boundaries.append(boundary)

        previous_x = 0
        for boundary in vertical_boundaries:
            fitted.append(
                panel_box_from_pixel(
                    PixelBox(x=previous_x, y=top, w=boundary - previous_x, h=bottom - top),
                    width,
                    height,
                )
            )
            previous_x = boundary
        fitted.append(
            panel_box_from_pixel(
                PixelBox(x=previous_x, y=top, w=width - previous_x, h=bottom - top),
                width,
                height,
            )
        )

    return normalize_panel_boxes(fitted)


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


def detect_panel_boxes(
    image_path: Path,
    layout_or_expected_count: dict[str, Any] | int,
    expected_count: int | None = None,
) -> tuple[list[PanelBox], np.ndarray]:
    image = cv2.imread(str(image_path))
    if image is None:
        raise FileNotFoundError(f"Unable to read image: {image_path}")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape

    layout = layout_or_expected_count if isinstance(layout_or_expected_count, dict) else {}
    count = expected_count if expected_count is not None else int(layout_or_expected_count)
    row_structure = row_structure_from_layout(layout, count)
    if row_structure:
        guided_boxes = detect_guided_whitespace_boxes(gray, row_structure)
        if len(guided_boxes) == count:
            boxes = [
                PanelBox(
                    x=box.x / width,
                    y=box.y / height,
                    w=box.w / width,
                    h=box.h / height,
                )
                for box in guided_boxes
            ]
            return normalize_panel_boxes(boxes), image

    whitespace_boxes = detect_whitespace_split_boxes(gray, count)
    if len(whitespace_boxes) == count:
        boxes = [
            PanelBox(
                x=box.x / width,
                y=box.y / height,
                w=box.w / width,
                h=box.h / height,
            )
            for box in whitespace_boxes
        ]
        return normalize_panel_boxes(boxes), image

    template_boxes = template_boxes_from_layout(layout)
    if len(template_boxes) == count:
        whitespace_fitted = fit_boxes_to_whitespace_template(gray, template_boxes)
        if len(whitespace_fitted) == count:
            return whitespace_fitted, image

        fitted_boxes = normalize_panel_boxes([fit_box_to_template(gray, box) for box in template_boxes])
        if validate_template_pattern(fitted_boxes, str(layout.get("layout_pattern", ""))):
            return fitted_boxes, image
        return normalize_panel_boxes(template_boxes), image

    rectangles = find_rectangular_boxes(gray)
    pixel_boxes = adjust_box_count(rectangles, count, gray)

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

    return normalize_panel_boxes(boxes), image


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
        "--layout",
        help="Optional path to comic_reader_layout_vN.json. Defaults to latest in passage.",
    )
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
    layout_path = resolve_path(args.layout) if args.layout else latest_layout_path(passage_dir)
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
