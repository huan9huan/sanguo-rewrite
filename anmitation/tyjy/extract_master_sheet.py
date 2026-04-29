#!/usr/bin/env python3
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "master_sheet_v2.png"
OUTPUTS = {
    "liubei_idle_v2.png": (70, 40, 540, 555),
    "guanyu_idle_v2.png": (630, 30, 1085, 560),
    "zhangfei_idle_v2.png": (1210, 40, 1670, 560),
    "oath_group_v2.png": (430, 565, 1265, 900),
}


def background_mask(image: Image.Image) -> list[bool]:
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()

    sample_points = [
        (0, 0),
        (width - 1, 0),
        (0, height - 1),
        (width - 1, height - 1),
        (width // 2, 0),
        (width // 2, height - 1),
    ]

    base_r = base_g = base_b = 0
    for x, y in sample_points:
        r, g, b = pixels[x, y]
        base_r += r
        base_g += g
        base_b += b
    total = len(sample_points)
    base_r //= total
    base_g //= total
    base_b //= total

    mask = [False] * (width * height)
    visited = [False] * (width * height)
    queue: deque[tuple[int, int]] = deque()

    def is_background(x: int, y: int) -> bool:
        r, g, b = pixels[x, y]
        brightness = (r + g + b) / 3
        spread = max(r, g, b) - min(r, g, b)
        dist = ((r - base_r) ** 2 + (g - base_g) ** 2 + (b - base_b) ** 2) ** 0.5
        return brightness > 210 and spread < 28 and dist < 48

    def enqueue(x: int, y: int) -> None:
        if x < 0 or x >= width or y < 0 or y >= height:
            return
        idx = y * width + x
        if visited[idx] or not is_background(x, y):
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
        mask[idx] = True
        enqueue(x + 1, y)
        enqueue(x - 1, y)
        enqueue(x, y + 1)
        enqueue(x, y - 1)

    return mask


def cutout_character(source: Image.Image, box: tuple[int, int, int, int], out_path: Path) -> None:
    crop = source.crop(box).convert("RGBA")
    width, height = crop.size
    mask = background_mask(crop)
    alpha = Image.new("L", crop.size, 255)
    alpha_pixels = alpha.load()

    for y in range(height):
        for x in range(width):
            idx = y * width + x
            if mask[idx]:
                alpha_pixels[x, y] = 0

    alpha = alpha.filter(ImageFilter.GaussianBlur(radius=1.0))
    crop.putalpha(alpha)
    crop.save(out_path)


def main() -> None:
    source = Image.open(SOURCE)
    for name, box in OUTPUTS.items():
        out_path = ROOT / name
        if name.startswith("oath_group"):
            source.crop(box).save(out_path)
        else:
            cutout_character(source, box, out_path)
        print(f"wrote {out_path.name}")


if __name__ == "__main__":
    main()
