from __future__ import annotations

from collections import deque
from pathlib import Path

import cv2
import numpy as np


ROOT = Path(__file__).resolve().parent
INPUTS = {
    "saying.png": "saying-cut.png",
    "say-done.png": "say-done-cut.png",
}


def sample_background_color(lab: np.ndarray) -> np.ndarray:
    height, width = lab.shape[:2]
    size = max(12, min(height, width) // 24)
    patches = [
        lab[:size, :size],
        lab[:size, -size:],
        lab[-size:, :size],
        lab[-size:, -size:],
        lab[:size, width // 2 - size // 2 : width // 2 + size // 2],
        lab[-size:, width // 2 - size // 2 : width // 2 + size // 2],
    ]
    return np.mean(np.concatenate([patch.reshape(-1, 3) for patch in patches], axis=0), axis=0)


def build_background_mask(image: np.ndarray) -> np.ndarray:
    height, width = image.shape[:2]
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB).astype(np.float32)
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV).astype(np.float32)
    bg_color = sample_background_color(lab)

    distance = np.linalg.norm(lab - bg_color, axis=2)
    saturation = hsv[:, :, 1]
    value = hsv[:, :, 2]

    # Only pixels that look background-like are eligible.
    candidate = (
        ((distance < 26) & (saturation < 44) & (value > 150))
        | ((distance < 38) & (saturation < 24) & (value > 185))
    )

    visited = np.zeros((height, width), dtype=bool)
    background = np.zeros((height, width), dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        if x < 0 or x >= width or y < 0 or y >= height:
            return
        if visited[y, x] or not candidate[y, x]:
            return
        visited[y, x] = True
        queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        background[y, x] = True

        enqueue(x + 1, y)
        enqueue(x - 1, y)
        enqueue(x, y + 1)
        enqueue(x, y - 1)

    return background


def feather_alpha(background: np.ndarray) -> np.ndarray:
    fg_mask = (~background).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))

    fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel)
    fg_mask = cv2.medianBlur(fg_mask, 3)
    distance_fg = cv2.distanceTransform(fg_mask, cv2.DIST_L2, 3)
    distance_bg = cv2.distanceTransform(255 - fg_mask, cv2.DIST_L2, 3)

    signed = distance_fg - distance_bg
    alpha = np.clip((signed + 1.2) / 2.4, 0.0, 1.0)
    alpha[distance_fg >= 2.0] = 1.0
    alpha[distance_bg >= 2.0] = 0.0

    alpha_u8 = np.clip(alpha * 255.0, 0, 255).astype(np.uint8)
    alpha_u8 = cv2.GaussianBlur(alpha_u8, (0, 0), sigmaX=0.8, sigmaY=0.8)
    return alpha_u8.astype(np.float32) / 255.0


def decontaminate_edges(image: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    result = image.astype(np.float32).copy()
    edge_band = (alpha > 0.0) & (alpha < 0.92)
    if not np.any(edge_band):
        return image

    alpha_safe = np.clip(alpha, 1e-4, 1.0)
    edge_strength = np.clip((1.0 - alpha_safe) * 0.18, 0.0, 0.18)

    for channel in range(3):
        channel_data = result[:, :, channel]
        corrected = (channel_data - 255.0 * (1.0 - alpha_safe)) / alpha_safe
        corrected = np.clip(corrected, 0, 255)
        channel_data[edge_band] = (
            corrected[edge_band] * (1.0 - edge_strength[edge_band])
            + channel_data[edge_band] * edge_strength[edge_band]
        )
        result[:, :, channel] = channel_data

    return np.clip(result, 0, 255).astype(np.uint8)


def process_image(src_name: str, dst_name: str) -> None:
    src_path = ROOT / src_name
    dst_path = ROOT / dst_name

    image = cv2.imread(str(src_path), cv2.IMREAD_COLOR)
    if image is None:
        raise FileNotFoundError(src_path)

    background = build_background_mask(image)
    alpha = feather_alpha(background)
    cleaned = decontaminate_edges(image, alpha)

    bgra = cv2.cvtColor(cleaned, cv2.COLOR_BGR2BGRA)
    bgra[:, :, 3] = np.clip(alpha * 255.0, 0, 255).astype(np.uint8)
    cv2.imwrite(str(dst_path), bgra)


def main() -> None:
    for src_name, dst_name in INPUTS.items():
        process_image(src_name, dst_name)
        print(f"wrote {dst_name}")


if __name__ == "__main__":
    main()
