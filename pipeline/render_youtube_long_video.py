from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from typing import Any

from pipeline.render_youtube_long_preview import ROOT, render_preview


TRANSITION_STEPS = 9


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def rel(path: Path) -> str:
    try:
        return path.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def run_checked(cmd: list[str], *, quiet: bool = False) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        cmd,
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE if quiet else None,
        stderr=subprocess.PIPE,
        check=True,
    )


def duration_ms(path: Path) -> int:
    proc = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )
    return round(float(proc.stdout.strip()) * 1000)


def transition_at(transitions: list[dict[str, Any]], ms: int) -> dict[str, Any] | None:
    for item in transitions:
        start = int(item["start_ms"])
        end = start + int(item["duration_ms"])
        if start <= ms < end:
            return item
    return None


def build_segments(timeline: dict[str, Any], assembly_plan: dict[str, Any]) -> list[dict[str, Any]]:
    lines = timeline["lines"]
    transitions = assembly_plan.get("transitions", [])
    segments: list[dict[str, Any]] = []
    cursor = 0

    for line in lines:
        start = int(line["start_ms"])
        if start > cursor:
            transition = transition_at(transitions, cursor)
            if transition:
                # Boundary silence is a visual page turn, not a blank gap.
                transition_start = int(transition["start_ms"])
                transition_duration = int(transition["duration_ms"])
                step_duration = transition_duration / TRANSITION_STEPS
                for index in range(TRANSITION_STEPS):
                    ms = transition_start + round(index * step_duration)
                    segments.append(
                        {
                            "type": "transition",
                            "ms": ms,
                            "duration_ms": round(step_duration),
                        }
                    )
            else:
                segments.append({"type": "hold", "ms": cursor, "duration_ms": start - cursor})

        end = int(line["pause_end_ms"])
        duration = max(1, end - start)
        segments.append({"type": "line", "ms": start, "duration_ms": duration, "line_id": line["id"]})
        cursor = end

    final_duration = int(timeline["duration_ms"])
    if cursor < final_duration:
        segments.append({"type": "hold", "ms": cursor, "duration_ms": final_duration - cursor})

    return [segment for segment in segments if int(segment["duration_ms"]) > 0]


def write_concat_list(path: Path, frame_items: list[tuple[Path, float]]) -> None:
    rows: list[str] = []
    for frame_path, seconds in frame_items:
        rows.append(f"file '{frame_path.as_posix()}'")
        rows.append(f"duration {seconds:.6f}")
    if frame_items:
        rows.append(f"file '{frame_items[-1][0].as_posix()}'")
    path.write_text("\n".join(rows) + "\n", encoding="utf-8")


def render(args: argparse.Namespace) -> int:
    run_dir = Path(args.run)
    if not run_dir.is_absolute():
        run_dir = ROOT / run_dir
    lang = args.lang

    timeline_path = run_dir / f"combined_timeline_{lang}.json"
    assembly_path = run_dir / f"assembly_plan_{lang}.json"
    audio_path = run_dir / "output" / f"youtube_long_{lang}.mp3"
    output_dir = run_dir / "output"
    frames_dir = run_dir / "video_frames"
    output_dir.mkdir(parents=True, exist_ok=True)
    frames_dir.mkdir(parents=True, exist_ok=True)

    timeline = load_json(timeline_path)
    assembly_plan = load_json(assembly_path)
    if not audio_path.exists():
        raise SystemExit(f"Missing assembled audio: {audio_path}")

    segments = build_segments(timeline, assembly_plan)
    frame_items: list[tuple[Path, float]] = []

    for index, segment in enumerate(segments, start=1):
        frame_path = frames_dir / f"frame_{index:04d}_{segment['ms']}ms.png"
        if args.force or not frame_path.exists():
            render_preview(run_dir, int(segment["ms"]), frame_path)
        frame_items.append((frame_path, int(segment["duration_ms"]) / 1000))
        if index % 25 == 0 or index == len(segments):
            print(f"rendered {index}/{len(segments)} stills")

    concat_path = run_dir / f"video_concat_{lang}.txt"
    write_concat_list(concat_path, frame_items)

    silent_video = output_dir / f"youtube_long_{lang}_silent.mp4"
    output_video = output_dir / f"youtube_long_{lang}.mp4"

    run_checked(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_path),
            # CFR avoids concat stills producing a shorter video stream than audio.
            "-vf",
            "fps=24,format=yuv420p",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "20",
            str(silent_video),
        ],
        quiet=True,
    )
    run_checked(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(silent_video),
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
            str(output_video),
        ],
        quiet=True,
    )
    silent_video.unlink(missing_ok=True)

    manifest = {
        "chapter": assembly_plan["chapter"],
        "language": lang,
        "renderer": "pipeline.render_youtube_long_video",
        "render_mode": "line_stills_with_transition_stills",
        "layout_contract": {
            "canvas": "1920x1080",
            "fps": 24,
            "public_text_only": True,
            "no_internal_ids": ["cp001", "p01", "f1", "run001", "preview"],
            "page_transition": "visual-only during assembly transition silence",
            "frame_highlight": "subtle grey-white guide",
            "frame_state": "reset on source_passage change",
        },
        "source_timeline": rel(timeline_path),
        "source_audio": rel(audio_path),
        "concat_list": rel(concat_path),
        "frames_dir": rel(frames_dir),
        "output": rel(output_video),
        "duration_ms": duration_ms(output_video),
        "segments": len(segments),
        "transition_steps": TRANSITION_STEPS,
    }
    manifest_path = run_dir / f"video_manifest_{lang}.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({"output": rel(output_video), "manifest": rel(manifest_path), "duration_ms": manifest["duration_ms"]}, ensure_ascii=False, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Render a 16:9 YouTube long-video MP4 from an assembly run.")
    parser.add_argument("--run", required=True, help="YouTube assembly run directory.")
    parser.add_argument("--lang", default="en", choices=["en", "zh"])
    parser.add_argument("--force", action="store_true", help="Regenerate existing still frames.")
    return parser


def main() -> int:
    return render(build_parser().parse_args())


if __name__ == "__main__":
    raise SystemExit(main())
