from __future__ import annotations

import math
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import yaml
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
BEAT_PATH = ROOT / "beat.yaml"


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


FONT_TITLE = load_font(34)
FONT_SUBTITLE = load_font(22)
FONT_BODY = load_font(20)
FONT_SMALL = load_font(16)


def fit_cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    scale = max(target_w / image.width, target_h / image.height)
    resized = image.resize((int(image.width * scale), int(image.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def fit_contain(image: Image.Image, size: tuple[int, int], bg=(250, 246, 237)) -> Image.Image:
    target_w, target_h = size
    scale = min(target_w / image.width, target_h / image.height)
    resized = image.resize((int(image.width * scale), int(image.height * scale)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", size, bg)
    canvas.paste(resized, ((target_w - resized.width) // 2, (target_h - resized.height) // 2))
    return canvas


def ease_out_cubic(t: float) -> float:
    return 1 - pow(1 - max(0, min(1, t)), 3)


def round_rect(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill, outline=None, width=1) -> None:
    draw.rounded_rectangle(box, radius=8, fill=fill, outline=outline, width=width)


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[int, int],
    font: ImageFont.ImageFont,
    fill,
    max_width: int,
    line_gap: int = 6,
) -> int:
    x, y = xy
    current = ""
    lines: list[str] = []
    for char in text:
        test = current + char
        if draw.textbbox((0, 0), test, font=font)[2] <= max_width or not current:
            current = test
        else:
            lines.append(current)
            current = char
    if current:
        lines.append(current)

    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        y += font.size + line_gap if hasattr(font, "size") else 24
    return y


def crop_cells(sheet: Image.Image, columns: int, rows: int) -> dict[int, Image.Image]:
    cell_w = sheet.width // columns
    cell_h = sheet.height // rows
    cells = {}
    for row in range(rows):
        for col in range(columns):
            cell_id = row * columns + col + 1
            cells[cell_id] = sheet.crop((col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h)).convert("RGB")
    return cells


def draw_asset_card(
    frame: Image.Image,
    cell: Image.Image,
    box: tuple[int, int, int, int],
    title: str,
    caption: str,
    alpha: float,
) -> None:
    if alpha <= 0:
        return
    overlay = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    x1, y1, x2, y2 = box
    round_rect(draw, box, fill=(252, 248, 238, int(238 * alpha)), outline=(60, 45, 32, int(170 * alpha)), width=2)
    image_box = (x1 + 12, y1 + 12, x2 - 12, y1 + int((y2 - y1) * 0.58))
    asset = fit_contain(cell, (image_box[2] - image_box[0], image_box[3] - image_box[1]), bg=(247, 240, 226)).convert("RGBA")
    asset.putalpha(int(255 * alpha))
    overlay.alpha_composite(asset, (image_box[0], image_box[1]))
    draw.text((x1 + 16, image_box[3] + 10), title, font=FONT_SUBTITLE, fill=(35, 29, 24, int(255 * alpha)))
    draw_wrapped(draw, caption, (x1 + 16, image_box[3] + 42), FONT_SMALL, (63, 52, 43, int(245 * alpha)), x2 - x1 - 32)
    frame.alpha_composite(overlay)


def draw_status_panel(frame: Image.Image, data: dict, progress: float) -> None:
    overlay = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    panel = (930, 42, 1236, 500)
    round_rect(draw, panel, fill=(31, 38, 35, 218), outline=(219, 206, 174, 95), width=1)
    draw.text((956, 68), "DSL Beat State", font=FONT_SUBTITLE, fill=(242, 229, 196, 255))
    draw.text((956, 104), data["id"], font=FONT_SMALL, fill=(186, 176, 153, 255))

    y = 148
    items = [
        ("location", data["location"]["label"]),
        ("beat_type", data["beat"]["type"]),
        ("primary", data["focus"]["primary"]),
        ("change", data["beat"]["change"]),
    ]
    for key, value in items:
        draw.text((956, y), key, font=FONT_SMALL, fill=(151, 190, 171, 255))
        y = draw_wrapped(draw, str(value), (956, y + 24), FONT_BODY, (252, 248, 238, 255), 250, line_gap=5) + 12

    bar_x, bar_y, bar_w = 956, 446, 244
    draw.rounded_rectangle((bar_x, bar_y, bar_x + bar_w, bar_y + 8), radius=4, fill=(82, 86, 75, 255))
    draw.rounded_rectangle((bar_x, bar_y, bar_x + int(bar_w * progress), bar_y + 8), radius=4, fill=(226, 174, 87, 255))
    frame.alpha_composite(overlay)


def make_frame(data: dict, cells: dict[int, Image.Image], frame_index: int, total_frames: int) -> Image.Image:
    width = data["render"]["size"]["width"]
    height = data["render"]["size"]["height"]
    fps = data["render"]["fps"]
    t = frame_index / fps
    progress = frame_index / max(1, total_frames - 1)

    phase = min(3, int(t // 2))
    phase_t = (t - phase * 2) / 2

    bg_cell = cells[2] if phase >= 1 else cells[1]
    bg = fit_cover(bg_cell, (width, height)).filter(ImageFilter.GaussianBlur(1.2)).convert("RGBA")
    wash = Image.new("RGBA", (width, height), (24, 23, 20, 76))
    frame = Image.alpha_composite(bg, wash)
    draw = ImageDraw.Draw(frame)

    draw.text((56, 42), data["title"], font=FONT_TITLE, fill=(255, 246, 218, 255))
    draw.text((58, 84), data["beat"]["action"], font=FONT_BODY, fill=(229, 219, 195, 240))

    # Programmatic stage assembled from the asset sheet cells.
    stage = (56, 128, 884, 500)
    round_rect(draw, stage, fill=(246, 238, 219, 232), outline=(54, 42, 32, 190), width=2)
    stage_bg = fit_cover(bg_cell, (stage[2] - stage[0] - 24, stage[3] - stage[1] - 24)).convert("RGBA")
    stage_bg.putalpha(220)
    frame.alpha_composite(stage_bg, (stage[0] + 12, stage[1] + 12))

    if phase >= 1:
        a = ease_out_cubic(phase_t if phase == 1 else 1)
        shadow = fit_contain(cells[8], (210, 265), bg=(247, 240, 226)).convert("RGBA")
        shadow.putalpha(int(235 * a))
        frame.alpha_composite(shadow, (640, 178))

    if phase >= 2:
        a = ease_out_cubic(phase_t if phase == 2 else 1)
        guan = fit_contain(cells[7], (228, 290), bg=(247, 240, 226)).convert("RGBA")
        guan.putalpha(int(245 * a))
        frame.alpha_composite(guan, (612, 170))
        draw_asset_card(frame, cells[10], (94, 156, 310, 424), "刘备", data["characters"]["liu_bei"]["caption"], a)
        draw_asset_card(frame, cells[12], (334, 156, 550, 424), "张飞", data["characters"]["zhang_fei"]["caption"], a)

    if phase >= 3:
        a = ease_out_cubic(phase_t)
        draw_asset_card(frame, cells[13], (94, 150, 338, 420), "分镜", "门口、酒桌、三人视线形成开放三角。", a)
        draw_asset_card(frame, cells[16], (364, 150, 608, 420), "关系", data["relations"][0]["label"], a)
        draw_asset_card(frame, cells[7], (634, 150, 858, 420), "关羽", data["characters"]["guan_yu"]["caption"], a)

    captions = data["timeline"]
    caption = captions[phase]["caption"]
    caption_box = (56, 548, 1236, 650)
    round_rect(draw, caption_box, fill=(20, 24, 22, 224), outline=(226, 174, 87, 150), width=1)
    draw_wrapped(draw, caption, (84, 575), FONT_TITLE, (255, 247, 224, 255), 1080, line_gap=8)
    draw_status_panel(frame, data, progress)
    return frame.convert("RGB")


def main() -> int:
    data = yaml.safe_load(BEAT_PATH.read_text(encoding="utf-8"))
    sheet_path = ROOT / data["assets"]["sheet"]
    sheet = Image.open(sheet_path).convert("RGB")
    cells = crop_cells(sheet, data["assets"]["grid"]["columns"], data["assets"]["grid"]["rows"])

    fps = int(data["render"]["fps"])
    duration = float(data["render"]["duration_seconds"])
    total_frames = int(fps * duration)
    output_video = ROOT / data["render"]["output_video"]
    output_preview = ROOT / data["render"]["output_preview"]
    output_video.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="b01_frames_", dir=output_video.parent) as temp:
        temp_path = Path(temp)
        for index in range(total_frames):
            frame = make_frame(data, cells, index, total_frames)
            frame.save(temp_path / f"frame_{index:04d}.png")
            if index == int(total_frames * 0.72):
                frame.save(output_preview)

        ffmpeg = shutil.which("ffmpeg")
        if not ffmpeg:
            raise RuntimeError("ffmpeg not found")
        command = [
            ffmpeg,
            "-y",
            "-framerate",
            str(fps),
            "-i",
            str(temp_path / "frame_%04d.png"),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(output_video),
        ]
        subprocess.run(command, check=True)

    print(output_video)
    print(output_preview)
    return 0


if __name__ == "__main__":
    sys.exit(main())
