from __future__ import annotations

import argparse
import json
import math
import subprocess
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


CANVAS_W = 1080
CANVAS_H = 1920
FPS = 24


def load_font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/System/Library/Fonts/Supplemental/Songti.ttc",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Helvetica.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def text_size(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> tuple[int, int]:
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def wrap_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.ImageFont,
    max_width: int,
) -> list[str]:
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


def crop_frames(comic_path: Path, comic_json: dict[str, Any], frames_dir: Path) -> dict[str, dict[str, Any]]:
    image = Image.open(comic_path).convert("RGB")
    width, height = image.size
    frames_dir.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, dict[str, Any]] = {}

    for frame in comic_json["frames"]:
        frame_id = frame["frame_id"]
        box = frame["panel_box"]
        left = round(box["x"] * width)
        top = round(box["y"] * height)
        right = round((box["x"] + box["w"]) * width)
        bottom = round((box["y"] + box["h"]) * height)
        crop = image.crop((left, top, right, bottom))
        out = frames_dir / f"{frame_id}.png"
        crop.save(out)
        manifest[frame_id] = {
            "frame_id": frame_id,
            "file": out.as_posix(),
            "source_panel_box": box,
            "source_pixel_box": {"x": left, "y": top, "w": right - left, "h": bottom - top},
            "size": {"w": crop.size[0], "h": crop.size[1]},
            "title": frame.get("text_block", {}).get("title", frame_id),
        }

    return manifest


def resolve_effective_frames(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    current_frame: str | None = None
    resolved = []
    for line in lines:
        frame_id = line.get("frame_id")
        anchor = line.get("visual_anchor", "none")
        if frame_id == "f0":
            frame_id = None
        elif frame_id:
            current_frame = frame_id
        elif anchor == "hold_previous" and current_frame:
            frame_id = current_frame
        else:
            frame_id = current_frame
        item = dict(line)
        item["effective_frame_id"] = frame_id
        resolved.append(item)
    return resolved


def build_shots(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    shots: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    for line in lines:
        frame_id = line["effective_frame_id"]
        if not frame_id:
            continue
        if current is None or current["frame_id"] != frame_id:
            if current is not None:
                shots.append(current)
            current = {
                "shot_id": f"s{len(shots) + 1:03d}",
                "frame_id": frame_id,
                "start_ms": line["start_ms"],
                "end_ms": line["pause_end_ms"],
                "line_ids": [line["id"]],
                "motion": motion_for_frame(frame_id),
            }
        else:
            current["end_ms"] = line["pause_end_ms"]
            current["line_ids"].append(line["id"])
    if current is not None:
        shots.append(current)
    return shots


def motion_for_frame(frame_id: str) -> str:
    return {
        "f1": "slow_push_in",
        "f2": "guided_pan_left_to_right",
        "f3": "impact_push_in",
        "f4": "slow_push_to_notice",
    }.get(frame_id, "slow_push_in")


def ease(t: float) -> float:
    return 0.5 - 0.5 * math.cos(math.pi * max(0.0, min(1.0, t)))


def fit_image_size(image: Image.Image, max_w: int, max_h: int, scale: float) -> tuple[int, int]:
    base = min(max_w / image.width, max_h / image.height)
    factor = base * scale
    return max(1, round(image.width * factor)), max(1, round(image.height * factor))


def current_line_at(lines: list[dict[str, Any]], ms: int) -> dict[str, Any]:
    for line in lines:
        if line["start_ms"] <= ms < line["pause_end_ms"]:
            return line
    return lines[-1]


def current_shot_at(shots: list[dict[str, Any]], ms: int) -> dict[str, Any]:
    for shot in shots:
        if shot["start_ms"] <= ms < shot["end_ms"]:
            return shot
    return shots[-1]


def before_first_shot(shots: list[dict[str, Any]], ms: int) -> bool:
    return bool(shots) and ms < shots[0]["start_ms"]


def draw_subtitle(
    canvas: Image.Image,
    line: dict[str, Any],
    *,
    title_font: ImageFont.ImageFont,
    speaker_font: ImageFont.ImageFont,
    body_font: ImageFont.ImageFont,
) -> None:
    draw = ImageDraw.Draw(canvas)
    has_cjk = any("\u4e00" <= char <= "\u9fff" for char in line["text"])
    if has_cjk:
        speaker = "听者" if line["speaker"] == "listener" else "旁白"
    else:
        speaker = line["speaker"].upper()
    is_listener = line["speaker"] == "listener"
    accent = (216, 177, 90) if not is_listener else (90, 160, 210)
    panel_bg = (18, 20, 22, 226)
    left = 70
    right = CANVAS_W - 70
    max_width = right - left - 44
    wrapped = wrap_text(draw, line["text"], body_font, max_width)
    wrapped = wrapped[:3]
    line_h = text_size(draw, "Ag", body_font)[1] + 16
    box_h = 42 + len(wrapped) * line_h + 46
    box_y = CANVAS_H - box_h - 84

    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rounded_rectangle((left, box_y, right, box_y + box_h), radius=22, fill=panel_bg)
    od.rectangle((left, box_y, left + 8, box_y + box_h), fill=accent)
    od.text((left + 28, box_y + 20), speaker, font=speaker_font, fill=accent)

    y = box_y + 62
    for part in wrapped:
        od.text((left + 28, y), part, font=body_font, fill=(244, 240, 230))
        y += line_h

    canvas.alpha_composite(overlay)


def render_frame(
    frame_images: dict[str, Image.Image],
    frame_titles: dict[str, str],
    shots: list[dict[str, Any]],
    lines: list[dict[str, Any]],
    ms: int,
    *,
    opening_card: Image.Image | None,
    title_font: ImageFont.ImageFont,
    speaker_font: ImageFont.ImageFont,
    body_font: ImageFont.ImageFont,
) -> Image.Image:
    if opening_card is not None and before_first_shot(shots, ms):
        return opening_card.resize((CANVAS_W, CANVAS_H), Image.Resampling.LANCZOS).convert("RGB")

    line = current_line_at(lines, ms)
    shot = current_shot_at(shots, ms)
    frame_id = shot["frame_id"]
    image = frame_images[frame_id]

    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (238, 232, 220, 255))
    bg = image.resize((CANVAS_W, CANVAS_H), Image.Resampling.LANCZOS)
    bg = ImageEnhance.Contrast(bg).enhance(0.65)
    bg = ImageEnhance.Brightness(bg).enhance(1.08)
    bg = bg.filter(ImageFilter.GaussianBlur(22))
    canvas.alpha_composite(bg.convert("RGBA"))
    wash = Image.new("RGBA", canvas.size, (238, 232, 220, 160))
    canvas.alpha_composite(wash)

    shot_t = 0.0
    if shot["end_ms"] > shot["start_ms"]:
        shot_t = (ms - shot["start_ms"]) / (shot["end_ms"] - shot["start_ms"])
    e = ease(shot_t)

    max_w = 980
    max_h = 980
    scale = 1.0 + 0.09 * e
    if shot["motion"] == "impact_push_in":
        scale = 1.03 + 0.11 * e
    elif shot["motion"] == "guided_pan_left_to_right":
        scale = 1.12
    elif shot["motion"] == "slow_push_to_notice":
        scale = 1.0 + 0.12 * e

    draw_w, draw_h = fit_image_size(image, max_w, max_h, scale)
    resized = image.resize((draw_w, draw_h), Image.Resampling.LANCZOS).convert("RGBA")

    x_center = CANVAS_W // 2
    if shot["motion"] == "guided_pan_left_to_right":
        x_center = round(CANVAS_W * (0.46 + 0.08 * e))
    y_center = 690
    if frame_id in {"f1", "f4"}:
        y_center = 660
    x = x_center - draw_w // 2
    y = y_center - draw_h // 2

    shadow = Image.new("RGBA", resized.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((0, 0, draw_w, draw_h), radius=18, fill=(0, 0, 0, 90))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(16)), (x + 10, y + 18))
    canvas.alpha_composite(resized, (x, y))

    draw = ImageDraw.Draw(canvas)
    title = frame_titles.get(frame_id, frame_id)
    tw, _ = text_size(draw, title, title_font)
    draw.text(((CANVAS_W - tw) // 2, 92), title, font=title_font, fill=(38, 35, 30))

    draw_subtitle(canvas, line, title_font=title_font, speaker_font=speaker_font, body_font=body_font)
    return canvas.convert("RGB")


def write_storyboard(run_dir: Path, shots: list[dict[str, Any]], lines_by_id: dict[str, dict[str, Any]]) -> None:
    rows = ["# Podcast Motion Comic Storyboard", ""]
    for shot in shots:
        rows.append(f"## {shot['shot_id']} - {shot['frame_id']}")
        rows.append("")
        rows.append(f"- Time: {shot['start_ms']}ms -> {shot['end_ms']}ms")
        rows.append(f"- Motion: `{shot['motion']}`")
        rows.append("- Lines:")
        for line_id in shot["line_ids"]:
            line = lines_by_id[line_id]
            rows.append(f"  - {line['speaker']}: {line['text']}")
        rows.append("")
    (run_dir / "storyboard_en.md").write_text("\n".join(rows), encoding="utf-8")


def render(args: argparse.Namespace) -> int:
    passage = Path(args.passage)
    run_dir = Path(args.run)
    lang = args.lang
    video_dir = run_dir / "video"
    frames_dir = video_dir / "frames"
    output_dir = video_dir / "output"
    output_dir.mkdir(parents=True, exist_ok=True)

    comic_path = passage / "current" / "comic.png"
    comic_json_path = passage / "current" / "comic.json"
    timeline_path = run_dir / f"timeline_{lang}.json"
    audio_path = run_dir / "output" / f"episode_{lang}.mp3"

    comic_json = json.loads(comic_json_path.read_text(encoding="utf-8"))
    timeline = json.loads(timeline_path.read_text(encoding="utf-8"))
    lines = resolve_effective_frames(timeline["lines"])
    shots = build_shots(lines)
    frame_manifest = crop_frames(comic_path, comic_json, frames_dir)

    (frames_dir / "frames_manifest.json").write_text(
        json.dumps({"source_image": comic_path.as_posix(), "frames": list(frame_manifest.values())}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (video_dir / f"shot_plan_{lang}.json").write_text(
        json.dumps({"language": timeline["language"], "shots": shots}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_storyboard(video_dir, shots, {line["id"]: line for line in lines})

    frame_images = {frame_id: Image.open(item["file"]).convert("RGB") for frame_id, item in frame_manifest.items()}
    frame_titles = {frame_id: item.get("title") or frame_id for frame_id, item in frame_manifest.items()}
    opening_card_path = Path(args.opening_card) if args.opening_card else None
    opening_card = Image.open(opening_card_path).convert("RGB") if opening_card_path and opening_card_path.exists() else None
    title_font = load_font(46, bold=True)
    speaker_font = load_font(28, bold=True)
    body_font = load_font(46, bold=True)

    total_ms = int(timeline["duration_ms"])
    total_frames = math.ceil(total_ms / 1000 * FPS)
    tmp_video = output_dir / f"podcast_motion_{lang}_silent.mp4"
    out_video = output_dir / f"podcast_motion_{lang}.mp4"
    cover = output_dir / f"cover_{lang}.png"

    ffmpeg = subprocess.Popen(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgb24",
            "-s",
            f"{CANVAS_W}x{CANVAS_H}",
            "-r",
            str(FPS),
            "-i",
            "-",
            "-an",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-preset",
            "veryfast",
            "-crf",
            "20",
            str(tmp_video),
        ],
        stdin=subprocess.PIPE,
    )
    assert ffmpeg.stdin is not None
    for frame_index in range(total_frames):
        ms = round(frame_index * 1000 / FPS)
        frame = render_frame(
            frame_images,
            frame_titles,
            shots,
            lines,
            min(ms, total_ms - 1),
            opening_card=opening_card,
            title_font=title_font,
            speaker_font=speaker_font,
            body_font=body_font,
        )
        if frame_index == 0:
            frame.save(cover)
        ffmpeg.stdin.write(frame.tobytes())
    ffmpeg.stdin.close()
    rc = ffmpeg.wait()
    if rc != 0:
        raise SystemExit(f"ffmpeg video render failed: {rc}")

    subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(tmp_video),
            "-i",
            str(audio_path),
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-shortest",
            str(out_video),
        ],
        check=True,
    )
    tmp_video.unlink(missing_ok=True)

    render_plan = {
        "language": timeline["language"],
        "canvas": {"w": CANVAS_W, "h": CANVAS_H, "fps": FPS},
        "audio": audio_path.as_posix(),
        "output": out_video.as_posix(),
        "cover": cover.as_posix(),
        "opening_card": opening_card_path.as_posix() if opening_card_path else None,
        "duration_ms": total_ms,
    }
    (video_dir / f"render_plan_{lang}.json").write_text(json.dumps(render_plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (video_dir / f"video_manifest_{lang}.json").write_text(
        json.dumps(
            {
                "language": timeline["language"],
                "source_timeline": timeline_path.as_posix(),
                "source_audio": audio_path.as_posix(),
                "source_comic": comic_path.as_posix(),
                "frames_manifest": (frames_dir / "frames_manifest.json").as_posix(),
                "shot_plan": (video_dir / f"shot_plan_{lang}.json").as_posix(),
                "render_plan": (video_dir / f"render_plan_{lang}.json").as_posix(),
                "output": out_video.as_posix(),
                "cover": cover.as_posix(),
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"output": out_video.as_posix(), "cover": cover.as_posix(), "frames": total_frames}, ensure_ascii=False, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Render a podcast-driven motion comic video.")
    parser.add_argument("passage", help="Passage path, such as story/cp001-p01.")
    parser.add_argument("--run", required=True, help="Podcast run directory.")
    parser.add_argument("--lang", default="en", choices=["en", "zh"], help="Language suffix.")
    parser.add_argument("--opening-card", help="Optional 9:16 opening card image shown before the first framed line.")
    return parser


def main() -> int:
    return render(build_parser().parse_args())


if __name__ == "__main__":
    raise SystemExit(main())
