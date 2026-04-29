#!/usr/bin/env python3
from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Remove a flat bright background by edge-connected flood fill.")
    parser.add_argument("images", nargs="+", help="Image paths to process in place.")
    return parser


def remove_bg(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    rgb = image.convert("RGB")
    pixels = rgb.load()

    points = [
        (0, 0),
        (width - 1, 0),
        (0, height - 1),
        (width - 1, height - 1),
        (width // 2, 0),
        (width // 2, height - 1),
    ]

    base = [0, 0, 0]
    for x, y in points:
        r, g, b = pixels[x, y]
        base[0] += r
        base[1] += g
        base[2] += b
    base = [value / len(points) for value in base]

    visited = [False] * (width * height)
    background = [False] * (width * height)
    queue: deque[tuple[int, int]] = deque()

    def looks_bg(x: int, y: int) -> bool:
        r, g, b = pixels[x, y]
        brightness = (r + g + b) / 3
        spread = max(r, g, b) - min(r, g, b)
        dist = ((r - base[0]) ** 2 + (g - base[1]) ** 2 + (b - base[2]) ** 2) ** 0.5
        return brightness > 210 and spread < 30 and dist < 52

    def enqueue(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= width or y >= height:
            return
        idx = y * width + x
        if visited[idx] or not looks_bg(x, y):
            return
        visited[idx] = True
        queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        idx = y * width + x
        background[idx] = True
        enqueue(x + 1, y)
        enqueue(x - 1, y)
        enqueue(x, y + 1)
        enqueue(x, y - 1)

    alpha = Image.new("L", (width, height), 255)
    alpha_px = alpha.load()
    for y in range(height):
      for x in range(width):
        if background[y * width + x]:
          alpha_px[x, y] = 0

    alpha = alpha.filter(ImageFilter.GaussianBlur(radius=1.0))
    image.putalpha(alpha)
    image.save(path)


def main() -> int:
    args = build_parser().parse_args()
    for raw_path in args.images:
        path = Path(raw_path)
        remove_bg(path)
        print(f"processed {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
