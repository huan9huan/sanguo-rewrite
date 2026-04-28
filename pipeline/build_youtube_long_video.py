from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BOUNDARY_PAUSE_MS = 900


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


def silence_file(path: Path, ms: int) -> None:
    if ms <= 0 or path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    run_checked(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "lavfi",
            "-i",
            "anullsrc=r=44100:cl=mono",
            "-t",
            f"{ms / 1000:.3f}",
            "-codec:a",
            "libmp3lame",
            "-q:a",
            "9",
            str(path),
        ],
        quiet=True,
    )


def parse_passage_run(value: str) -> tuple[Path, Path]:
    if "=" in value:
        passage_raw, run_raw = value.split("=", 1)
        return Path(passage_raw), Path(run_raw)

    run = Path(value)
    parts = run.parts
    if "podcast" not in parts:
        raise SystemExit(f"Cannot infer passage from run path: {value}")
    podcast_index = parts.index("podcast")
    if podcast_index == 0:
        raise SystemExit(f"Cannot infer passage from run path: {value}")
    return Path(*parts[:podcast_index]), run


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise SystemExit(f"Missing required file: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def output_run_dir(chapter: str, run_name: str) -> Path:
    chapter_dir = ROOT / "story" / chapter
    return chapter_dir / "youtube" / run_name


def next_run_name(chapter: str) -> str:
    youtube_dir = ROOT / "story" / chapter / "youtube"
    if not youtube_dir.exists():
        return "run001"
    nums = []
    for child in youtube_dir.iterdir():
        if child.is_dir() and child.name.startswith("run") and child.name[3:].isdigit():
            nums.append(int(child.name[3:]))
    return f"run{(max(nums) + 1 if nums else 1):03d}"


def is_next_episode_line(text: str) -> bool:
    return bool(re.search(r"\bnext episode\b", text, flags=re.IGNORECASE))


def is_standalone_opening_line(line: dict[str, Any]) -> bool:
    text = line.get("text", "")
    frame_id = line.get("frame_id")
    if frame_id:
        return False
    return bool(
        re.search(
            r"\b(last episode|at the end of the last episode|today,|we left|left off)\b",
            text,
            flags=re.IGNORECASE,
        )
    )


def filter_lines(
    passage: Path,
    run_dir: Path,
    timeline: dict[str, Any],
    *,
    first_passage: bool,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    kept: list[dict[str, Any]] = []
    dropped: list[dict[str, Any]] = []
    before_first_framed_line = True

    for line in timeline["lines"]:
        reason: str | None = None
        frame_id = line.get("frame_id")

        if frame_id and frame_id != "f0":
            before_first_framed_line = False

        if not first_passage and frame_id == "f0":
            reason = "later_passage_f0"
        elif is_next_episode_line(line.get("text", "")):
            reason = "episode_boundary_next_episode"
        elif not first_passage and before_first_framed_line and is_standalone_opening_line(line):
            reason = "later_passage_standalone_opening"

        if reason:
            dropped.append(
                {
                    "source_passage": passage.name,
                    "source_run": rel(run_dir),
                    "line_id": line["id"],
                    "reason": reason,
                    "frame_id": frame_id,
                    "text": line.get("text", ""),
                }
            )
            continue

        kept.append(line)

    return kept, dropped


def audio_path_for(line: dict[str, Any]) -> Path:
    raw = line.get("audio")
    if not raw:
        raise SystemExit(f"Line is missing audio path: {line['id']}")
    path = Path(raw)
    if not path.is_absolute():
        path = ROOT / path
    if not path.exists():
        raise SystemExit(f"Missing line audio for {line['id']}: {path}")
    return path


def write_subtitles(path: Path, lines: list[dict[str, Any]]) -> None:
    payload = [
        {
            "id": line["id"],
            "speaker": line["speaker"],
            "text": line["text"],
            "start_ms": line["start_ms"],
            "end_ms": line["pause_end_ms"],
            "source_passage": line["source_passage"],
        }
        for line in lines
    ]
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_upload_metadata(chapter: str, passages: list[dict[str, Any]], duration_ms_value: int) -> str:
    chapter_label = chapter.replace("cp", "Chapter ")
    minutes = max(1, round(duration_ms_value / 60000))
    passage_names = ", ".join(item["passage"] for item in passages)
    return "\n".join(
        [
            "# YouTube Upload Metadata",
            "",
            "## Title Options",
            "",
            f"1. Three Kingdoms for Beginners: The Oath Begins | {chapter_label}",
            "2. Three Brothers. One Broken Empire. | Three Kingdoms Retold",
            "3. The Peach Garden Oath Begins | Three Kingdoms for New Readers",
            "",
            "## Description Draft",
            "",
            "A clear, story-first retelling of Romance of the Three Kingdoms for new readers.",
            "",
            "An empire is breaking. Rebellion spreads. Before the war has a name, three strangers begin moving toward a choice that will bind them together.",
            "",
            f"This long episode combines {len(passages)} story passages into one continuous chapter-level video, about {minutes} minutes long.",
            "",
            f"Source passages: {passage_names}.",
            "",
            "## Thumbnail Direction",
            "",
            "Use Liu Bei, Guan Yu, and Zhang Fei as the first visual signal. Sell the human promise: three brothers, one broken empire.",
            "",
            "## Chapter Markers",
            "",
        ]
        + [f"- {item['start_ms'] // 1000:02d}s - {item['passage']}" for item in passages]
        + [""]
    )


def build(args: argparse.Namespace) -> int:
    lang = args.lang
    passage_runs = [parse_passage_run(value) for value in args.passage_run]
    if len(passage_runs) < 2:
        raise SystemExit("YouTube long video assembly needs at least two passage runs.")

    run_name = args.run_name or next_run_name(args.chapter)
    run_dir = output_run_dir(args.chapter, run_name)
    output_dir = run_dir / "output"
    silence_dir = run_dir / "silence"
    run_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    silence_dir.mkdir(parents=True, exist_ok=True)

    source_manifest: dict[str, Any] = {
        "chapter": args.chapter,
        "language": lang,
        "mode": "youtube_long_video_assembly",
        "passages": [],
    }
    assembly_plan: dict[str, Any] = {
        "chapter": args.chapter,
        "language": lang,
        "run": rel(run_dir),
        "policy": {
            "first_passage_f0": "keep",
            "later_passage_f0": "drop",
            "later_passage_opening_recaps": "drop_or_record",
            "source_files": "read_only",
        },
        "passages": [],
        "dropped_lines": [],
        "transitions": [],
    }

    combined_lines: list[dict[str, Any]] = []
    concat_entries: list[Path] = []
    cursor = 0

    for index, (passage, source_run) in enumerate(passage_runs):
        passage_path = (ROOT / passage).resolve() if not passage.is_absolute() else passage.resolve()
        source_run_path = (ROOT / source_run).resolve() if not source_run.is_absolute() else source_run.resolve()
        timeline_path = source_run_path / f"timeline_{lang}.json"
        audio_path = source_run_path / "output" / f"episode_{lang}.mp3"
        episode_path = source_run_path / f"episode_{lang}.json"
        comic_json_path = passage_path / "current" / "comic.json"
        comic_png_path = passage_path / "current" / "comic.png"

        for required in [timeline_path, audio_path, episode_path, comic_json_path, comic_png_path]:
            if not required.exists():
                raise SystemExit(f"Missing required file: {required}")

        timeline = load_json(timeline_path)
        kept, dropped = filter_lines(passage_path, source_run_path, timeline, first_passage=index == 0)
        if not kept:
            raise SystemExit(f"No kept lines after filtering: {passage_path.name}")

        if index > 0:
            silence = silence_dir / f"boundary_{DEFAULT_BOUNDARY_PAUSE_MS}ms.mp3"
            silence_file(silence, DEFAULT_BOUNDARY_PAUSE_MS)
            concat_entries.append(silence)
            assembly_plan["transitions"].append(
                {
                    "before_passage": passage_path.name,
                    "type": "silence",
                    "duration_ms": DEFAULT_BOUNDARY_PAUSE_MS,
                    "start_ms": cursor,
                }
            )
            cursor += DEFAULT_BOUNDARY_PAUSE_MS

        passage_start = cursor
        for line in kept:
            source_audio = audio_path_for(line)
            line_duration = int(line["duration_ms"])
            pause_ms = int(line.get("pause_after_ms", max(0, int(line["pause_end_ms"]) - int(line["end_ms"]))))
            assembled = dict(line)
            assembled["source_passage"] = passage_path.name
            assembled["source_run"] = rel(source_run_path)
            assembled["source_line_id"] = line["id"]
            assembled["audio"] = rel(source_audio)
            assembled["start_ms"] = cursor
            assembled["end_ms"] = cursor + line_duration
            assembled["pause_end_ms"] = cursor + line_duration + pause_ms
            combined_lines.append(assembled)
            concat_entries.append(source_audio)
            if pause_ms > 0:
                silence = silence_dir / f"silence_{pause_ms}ms.mp3"
                silence_file(silence, pause_ms)
                concat_entries.append(silence)
            cursor = assembled["pause_end_ms"]

        passage_end = cursor
        passage_item = {
            "passage": passage_path.name,
            "source_run": rel(source_run_path),
            "source_timeline": rel(timeline_path),
            "source_episode": rel(episode_path),
            "source_audio": rel(audio_path),
            "source_comic_json": rel(comic_json_path),
            "source_comic_png": rel(comic_png_path),
            "start_ms": passage_start,
            "end_ms": passage_end,
            "kept_lines": len(kept),
            "dropped_lines": len(dropped),
        }
        source_manifest["passages"].append(passage_item)
        assembly_plan["passages"].append(passage_item)
        assembly_plan["dropped_lines"].extend(dropped)

    concat_path = run_dir / f"concat_list_{lang}.txt"
    concat_path.write_text("".join(f"file '{path.as_posix()}'\n" for path in concat_entries), encoding="utf-8")

    output_audio = output_dir / f"youtube_long_{lang}.mp3"
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
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "128k",
            str(output_audio),
        ],
        quiet=True,
    )
    measured_duration = duration_ms(output_audio)

    combined_timeline = {
        "chapter": args.chapter,
        "language": "en-US" if lang == "en" else lang,
        "mode": "youtube_long_video_assembly",
        "source_manifest": rel(run_dir / "source_manifest.json"),
        "output_file": rel(output_audio),
        "duration_ms": measured_duration,
        "planned_duration_ms": cursor,
        "lines": combined_lines,
    }
    render_plan = {
        "chapter": args.chapter,
        "language": lang,
        "source_timeline": rel(run_dir / f"combined_timeline_{lang}.json"),
        "source_audio": rel(output_audio),
        "output_video": rel(output_dir / f"youtube_long_{lang}.mp4"),
        "cover": rel(output_dir / f"cover_{lang}.png"),
        "status": "assembly_mvp_ready_for_long_video_renderer",
        "notes": [
            "This MVP assembles timeline/audio/subtitles and records dropped boundary lines.",
            "Final long-video rendering is intentionally separate from source passage podcast renders.",
        ],
    }
    self_check = {
        "chapter": args.chapter,
        "language": lang,
        "checks": [
            {"name": "at_least_two_passages", "passed": len(passage_runs) >= 2},
            {"name": "combined_timeline_monotonic", "passed": all(a["start_ms"] <= a["end_ms"] <= a["pause_end_ms"] for a in combined_lines)},
            {"name": "later_f0_removed_or_recorded", "passed": all(line.get("frame_id") != "f0" or line["source_passage"] == passage_runs[0][0].name for line in combined_lines)},
            {"name": "dropped_lines_recorded", "passed": len(assembly_plan["dropped_lines"]) > 0},
            {"name": "audio_rendered", "passed": output_audio.exists() and measured_duration > 0},
        ],
        "duration_delta_ms": measured_duration - cursor,
        "publish_ready": False,
        "notes": [
            "Copy still needs Podcast Video Copy Evaluator before publish-ready use.",
            "Final mp4 rendering is not part of this MVP script.",
        ],
    }

    (run_dir / "source_manifest.json").write_text(json.dumps(source_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (run_dir / f"assembly_plan_{lang}.json").write_text(json.dumps(assembly_plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (run_dir / f"combined_timeline_{lang}.json").write_text(json.dumps(combined_timeline, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_subtitles(run_dir / f"combined_subtitles_{lang}.json", combined_lines)
    (run_dir / f"render_plan_{lang}.json").write_text(json.dumps(render_plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (run_dir / f"upload_metadata_{lang}.md").write_text(
        build_upload_metadata(args.chapter, assembly_plan["passages"], measured_duration),
        encoding="utf-8",
    )
    (run_dir / f"self_check_{lang}.json").write_text(json.dumps(self_check, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(
        json.dumps(
            {
                "run": rel(run_dir),
                "audio": rel(output_audio),
                "duration_ms": measured_duration,
                "lines": len(combined_lines),
                "dropped_lines": len(assembly_plan["dropped_lines"]),
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build a YouTube long-video assembly from multiple podcast passage runs.")
    parser.add_argument("--chapter", required=True, help="Chapter id for output, such as cp001.")
    parser.add_argument("--run-name", help="Output run name. Defaults to next runNNN.")
    parser.add_argument("--lang", default="en", choices=["en", "zh"], help="Language suffix.")
    parser.add_argument(
        "--passage-run",
        action="append",
        required=True,
        help="Passage run path, e.g. story/cp001-p01/podcast/run004. Can also use story/cp001-p01=story/cp001-p01/podcast/run004.",
    )
    return parser


def main() -> int:
    return build(build_parser().parse_args())


if __name__ == "__main__":
    raise SystemExit(main())
