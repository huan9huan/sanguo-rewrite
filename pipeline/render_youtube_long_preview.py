from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
CANVAS_W = 1920
CANVAS_H = 1080
BG = (22, 23, 24)
PAPER = (234, 229, 215)
INK = (246, 241, 230)
MUTED = (178, 169, 148)
GOLD = (224, 184, 88)
PROGRESS_TRACK = (80, 80, 76)
PROGRESS_DONE = (218, 216, 208)
PROGRESS_MARK = (242, 240, 232)
PROGRESS_LABEL = (202, 199, 190)
LISTENER = (235, 204, 118)
NARRATOR = (250, 246, 236)


def load_font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Helvetica.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/PingFang.ttc",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def text_size(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0], box[3] - box[1]


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if text_size(draw, candidate, font)[0] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def fit_size(image: Image.Image, max_w: int, max_h: int) -> tuple[int, int]:
    scale = min(max_w / image.width, max_h / image.height)
    return round(image.width * scale), round(image.height * scale)


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def line_at(lines: list[dict[str, Any]], ms: int) -> dict[str, Any]:
    for line in lines:
        if line["start_ms"] <= ms < line["pause_end_ms"]:
            return line
    return lines[-1]


def effective_frame(lines: list[dict[str, Any]], line: dict[str, Any]) -> str | None:
    current: str | None = None
    current_passage: str | None = None
    for item in lines:
        item_passage = item.get("source_passage")
        if item_passage != current_passage:
            # Passage pages are independent. A frameless first line on a new page
            # must start at that page's first frame, not inherit the previous page.
            current = None
            current_passage = item_passage
        frame_id = item.get("frame_id")
        if frame_id and frame_id != "f0":
            current = frame_id
        if item["id"] == line["id"]:
            if frame_id == "f0":
                return "f0"
            return frame_id or current or "f1"
    return line.get("frame_id")


def passage_info(source_manifest: dict[str, Any], passage: str) -> dict[str, Any]:
    for item in source_manifest["passages"]:
        if item["passage"] == passage:
            return item
    raise KeyError(passage)


def short_title(title: str) -> str:
    cleaned = title.strip()
    replacements = {
        "Prelude to Chaos": "Prelude",
        "A Hero's Sigh": "Hero's Sigh",
        "Oath of the Peach Garden": "The Oath",
        "Heroes and Small Men": "Small Men",
    }
    return replacements.get(cleaned, cleaned)


def load_passage_titles(chapter: str, lang: str) -> dict[str, str]:
    manifest = ROOT / "site" / "public" / "content" / "books" / "sanguo" / "chapters" / chapter / "manifest.json"
    titles: dict[str, str] = {}
    if manifest.exists():
        data = load_json(manifest)
        for item in data.get("passages", []):
            passage_id = item.get("id")
            title = item.get(f"title_{lang}") or item.get("title_en") or item.get("title") or passage_id
            if passage_id and title:
                titles[passage_id] = short_title(title)
    return titles


def load_chapter_title(chapter: str, lang: str) -> str:
    overlay = ROOT / "story" / f"{chapter}.{lang}.json"
    if overlay.exists():
        data = load_json(overlay)
        title = data.get("display_title") or data.get("title")
        if title:
            return title
    base = ROOT / "story" / f"{chapter}.json"
    if base.exists():
        data = load_json(base)
        return data.get("adapted_title_cn") or data.get("source_title") or "Three Kingdoms"
    return "Three Kingdoms"


def draw_opening(
    canvas: Image.Image,
    line: dict[str, Any],
    progress: float,
    passages: list[dict[str, Any]],
    titles: dict[str, str],
    chapter_title: str,
) -> None:
    draw = ImageDraw.Draw(canvas)
    title_font = load_font(76, bold=True)
    subtitle_font = load_font(36, bold=True)
    body_font = load_font(42, bold=True)

    for y in range(CANVAS_H):
        shade = 18 + round(25 * y / CANVAS_H)
        draw.line((0, y, CANVAS_W, y), fill=(shade, shade, shade + 2))

    draw.rectangle((0, 0, CANVAS_W, CANVAS_H), outline=(72, 62, 42), width=24)
    draw.text((110, 120), "Three Kingdoms", font=title_font, fill=INK)
    draw.text((116, 210), "for Beginners", font=subtitle_font, fill=GOLD)
    draw.line((112, 286, 760, 286), fill=GOLD, width=4)
    draw.text((112, 374), line["text"], font=body_font, fill=INK)
    draw.text((112, 890), chapter_title, font=subtitle_font, fill=MUTED)
    draw_progress(draw, progress, passages, titles)


def draw_comic_page(
    canvas: Image.Image,
    passage: str,
    frame_id: str | None,
    *,
    page_box: tuple[int, int, int, int],
) -> None:
    passage_dir = ROOT / "story" / passage
    comic = Image.open(passage_dir / "current" / "comic.png").convert("RGB")
    comic_json = load_json(passage_dir / "current" / "comic.json")
    x, y, w, h = page_box
    draw_w, draw_h = fit_size(comic, w, h)
    page_x = x + (w - draw_w) // 2
    page_y = y + (h - draw_h) // 2

    shadow = Image.new("RGBA", (draw_w, draw_h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((0, 0, draw_w, draw_h), radius=12, fill=(0, 0, 0, 105))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)), (page_x + 12, page_y + 16))

    page = comic.resize((draw_w, draw_h), Image.Resampling.LANCZOS).convert("RGBA")
    if frame_id and frame_id != "f0":
        overlay = Image.new("RGBA", page.size, (0, 0, 0, 92))
        od = ImageDraw.Draw(overlay)
        for frame in comic_json["frames"]:
            if frame.get("frame_id") != frame_id:
                continue
            box = frame["panel_box"]
            left = round(box["x"] * draw_w)
            top = round(box["y"] * draw_h)
            right = round((box["x"] + box["w"]) * draw_w)
            bottom = round((box["y"] + box["h"]) * draw_h)
            # Keep the active-frame guide quiet; the comic art should remain primary.
            od.rectangle((left, top, right, bottom), fill=(0, 0, 0, 0), outline=(232, 230, 220, 220), width=4)
            od.rectangle((left + 5, top + 5, right - 5, bottom - 5), outline=(160, 158, 150, 150), width=1)
            break
        page.alpha_composite(overlay)
    canvas.alpha_composite(page, (page_x, page_y))

    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle((page_x, page_y, page_x + draw_w, page_y + draw_h), radius=12, outline=(246, 240, 224), width=3)


def comic_page_layer(passage: str, *, page_box: tuple[int, int, int, int], opacity: float = 1.0) -> Image.Image:
    layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    passage_dir = ROOT / "story" / passage
    comic = Image.open(passage_dir / "current" / "comic.png").convert("RGB")
    x, y, w, h = page_box
    draw_w, draw_h = fit_size(comic, w, h)
    page_x = x + (w - draw_w) // 2
    page_y = y + (h - draw_h) // 2

    shadow = Image.new("RGBA", (draw_w, draw_h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((0, 0, draw_w, draw_h), radius=12, fill=(0, 0, 0, round(105 * opacity)))
    layer.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)), (page_x + 12, page_y + 16))

    page = comic.resize((draw_w, draw_h), Image.Resampling.LANCZOS).convert("RGBA")
    if opacity < 1.0:
        alpha = page.getchannel("A").point(lambda value: round(value * opacity))
        page.putalpha(alpha)
    layer.alpha_composite(page, (page_x, page_y))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle((page_x, page_y, page_x + draw_w, page_y + draw_h), radius=12, outline=(246, 240, 224, round(230 * opacity)), width=3)
    return layer


def draw_side_panel(
    canvas: Image.Image,
    line: dict[str, Any],
    passage: str,
    frame_id: str | None,
    *,
    chapter_title: str,
    passage_title: str,
) -> None:
    draw = ImageDraw.Draw(canvas)
    title_font = load_font(34, bold=True)
    meta_font = load_font(24, bold=True)
    body_font = load_font(42, bold=True)
    small_font = load_font(24)

    left = 1250
    top = 86
    right = 1828
    # Use reader-facing titles only. Do not expose cp/p/frame/run ids in video.
    draw.text((left, top), "Now Reading", font=meta_font, fill=GOLD)
    draw.text((left, top + 44), "Three Kingdoms for Beginners", font=title_font, fill=INK)
    draw.text((left, top + 96), chapter_title, font=meta_font, fill=MUTED)
    draw.text((left, top + 132), passage_title, font=small_font, fill=MUTED)

    speaker = line.get("speaker", "narrator")
    color = LISTENER if speaker == "listener" else NARRATOR
    draw.text((left, 344), speaker.upper(), font=meta_font, fill=color)

    wrapped = wrap_text(draw, line["text"], body_font, right - left)
    y = 396
    for part in wrapped[:7]:
        draw.text((left, y), part, font=body_font, fill=INK)
        y += 58

    draw.line((left, 830, right, 830), fill=(95, 85, 62), width=2)


def draw_progress(draw: ImageDraw.ImageDraw, progress: float, passages: list[dict[str, Any]], titles: dict[str, str]) -> None:
    left = 84
    right = CANVAS_W - 84
    y = 1016
    label_y = 972
    label_font = load_font(20, bold=True)
    small_font = load_font(18)
    draw.rounded_rectangle((left, y, right, y + 10), radius=5, fill=PROGRESS_TRACK)
    draw.rounded_rectangle((left, y, left + round((right - left) * progress), y + 10), radius=5, fill=PROGRESS_DONE)
    for item in passages:
        total = max(passages[-1]["end_ms"], 1)
        start = item["start_ms"]
        end = item["end_ms"]
        x = left + round((right - left) * start / total)
        end_x = left + round((right - left) * end / total)
        draw.line((x, y - 12, x, y + 22), fill=PROGRESS_MARK, width=3)
        title = titles.get(item["passage"], item["passage"])
        if end_x - x >= 135:
            tw, _ = text_size(draw, title, label_font)
            tx = max(left, min(right - tw, x + 8))
            draw.text((tx, label_y), title, font=label_font, fill=PROGRESS_LABEL)
        else:
            draw.text((x + 7, y + 24), title, font=small_font, fill=PROGRESS_LABEL)


def ease(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return 0.5 - 0.5 * __import__("math").cos(__import__("math").pi * t)


def transition_at(assembly_plan: dict[str, Any], ms: int) -> dict[str, Any] | None:
    for item in assembly_plan.get("transitions", []):
        start = int(item["start_ms"])
        end = start + int(item["duration_ms"])
        if start <= ms < end:
            return item
    return None


def previous_passage(source_manifest: dict[str, Any], before_passage: str) -> str:
    previous = source_manifest["passages"][0]["passage"]
    for item in source_manifest["passages"]:
        if item["passage"] == before_passage:
            return previous
        previous = item["passage"]
    return previous


def draw_transition(
    canvas: Image.Image,
    transition: dict[str, Any],
    source_manifest: dict[str, Any],
    titles: dict[str, str],
    chapter_title: str,
    progress: float,
    ms: int,
) -> None:
    draw = ImageDraw.Draw(canvas)
    page_box = (62, 54, 1128, 912)
    before = transition["before_passage"]
    after = previous_passage(source_manifest, before)
    t = (ms - int(transition["start_ms"])) / max(int(transition["duration_ms"]), 1)
    e = ease(t)

    old_layer = comic_page_layer(after, page_box=page_box, opacity=1.0 - 0.28 * e)
    new_layer = comic_page_layer(before, page_box=page_box, opacity=0.72 + 0.28 * e)

    old_dx = round(-260 * e)
    new_dx = round(410 * (1.0 - e))
    canvas.alpha_composite(old_layer, (old_dx, 0))
    canvas.alpha_composite(new_layer, (new_dx, 0))

    fold_x = 62 + 1128 - round(180 * e)
    fold = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    fd = ImageDraw.Draw(fold)
    fd.rectangle((fold_x, 74, fold_x + 18, 950), fill=(255, 255, 255, round(42 * (1.0 - abs(e - 0.5)))))
    fd.rectangle((fold_x + 20, 74, fold_x + 70, 950), fill=(0, 0, 0, round(78 * (1.0 - abs(e - 0.5)))))
    canvas.alpha_composite(fold.filter(ImageFilter.GaussianBlur(10)))

    title_font = load_font(44, bold=True)
    meta_font = load_font(26, bold=True)
    left = 1250
    draw.text((left, 170), "Turning the page", font=meta_font, fill=PROGRESS_LABEL)
    draw.text((left, 228), titles.get(before, before), font=title_font, fill=INK)
    draw.text((left, 294), chapter_title, font=meta_font, fill=MUTED)
    draw.line((left, 386, 1828, 386), fill=(95, 95, 88), width=2)
    draw.text((left, 428), "The story continues.", font=load_font(40, bold=True), fill=INK)
    draw_progress(draw, progress, source_manifest["passages"], titles)


def render_preview(run_dir: Path, ms: int, out: Path) -> None:
    timeline = load_json(run_dir / "combined_timeline_en.json")
    source_manifest = load_json(run_dir / "source_manifest.json")
    assembly_plan = load_json(run_dir / "assembly_plan_en.json")
    chapter = source_manifest["chapter"]
    titles = load_passage_titles(chapter, "en")
    chapter_title = load_chapter_title(chapter, "en")
    lines = timeline["lines"]
    line = line_at(lines, ms)
    frame_id = effective_frame(lines, line)
    progress = ms / max(int(timeline["duration_ms"]), 1)

    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), BG + (255,))
    bg = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    bd = ImageDraw.Draw(bg)
    bd.rectangle((0, 0, CANVAS_W, CANVAS_H), fill=(28, 28, 26, 255))
    bd.rectangle((32, 32, CANVAS_W - 32, CANVAS_H - 32), outline=(82, 72, 48, 255), width=2)
    canvas.alpha_composite(bg)

    transition = transition_at(assembly_plan, ms)
    if transition:
        draw_transition(canvas, transition, source_manifest, titles, chapter_title, progress, ms)
    elif frame_id == "f0":
        draw_opening(canvas, line, progress, source_manifest["passages"], titles, chapter_title)
    else:
        page_box = (62, 54, 1128, 912)
        draw_comic_page(canvas, line["source_passage"], frame_id, page_box=page_box)
        passage_title = titles.get(line["source_passage"], line["source_passage"])
        draw_side_panel(canvas, line, line["source_passage"], frame_id, chapter_title=chapter_title, passage_title=passage_title)
        draw_progress(ImageDraw.Draw(canvas), progress, source_manifest["passages"], titles)

    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(out)


def build(args: argparse.Namespace) -> int:
    run_dir = Path(args.run)
    if not run_dir.is_absolute():
        run_dir = ROOT / run_dir
    timeline = load_json(run_dir / "combined_timeline_en.json")
    lines = timeline["lines"]
    output_dir = run_dir / "preview"

    samples = args.ms
    if not samples:
        samples = [
            1_000,
            lines[20]["start_ms"],
            lines[60]["start_ms"],
            lines[110]["start_ms"],
            lines[170]["start_ms"],
            lines[-1]["start_ms"],
        ]

    outputs = []
    for index, ms in enumerate(samples, start=1):
        out = output_dir / f"preview_{index:02d}_{ms}ms.png"
        render_preview(run_dir, int(ms), out)
        outputs.append(out)

    print(json.dumps({"outputs": [str(path) for path in outputs]}, ensure_ascii=False, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Render 16:9 preview stills for a YouTube long-video assembly run.")
    parser.add_argument("--run", required=True, help="YouTube assembly run directory.")
    parser.add_argument("--ms", action="append", type=int, help="Specific timestamp in ms. May be repeated.")
    return parser


def main() -> int:
    return build(build_parser().parse_args())


if __name__ == "__main__":
    raise SystemExit(main())
