from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def escape_cell(value: Any) -> str:
    text = "" if value is None else str(value)
    return text.replace("|", "\\|").replace("\n", " ").strip()


def export(args: argparse.Namespace) -> int:
    run_dir = Path(args.run)
    episode_path = run_dir / f"episode_{args.lang}.json"
    if not episode_path.exists():
        raise SystemExit(f"Missing episode JSON: {episode_path}")

    episode = json.loads(episode_path.read_text(encoding="utf-8"))
    rows = [
        f"# {episode['title']}",
        "",
        f"- Episode ID: `{episode['episode_id']}`",
        f"- Source: `{episode['source_passage']}`",
        f"- Mode: `{episode['mode']}`",
        f"- Language: `{episode['language']}`",
        "",
        "| id | speaker | function | frame | anchor | pause | text |",
        "| --- | --- | --- | --- | --- | ---: | --- |",
    ]

    for line in episode["lines"]:
        rows.append(
            "| "
            + " | ".join(
                [
                    escape_cell(line["id"]),
                    escape_cell(line["speaker"]),
                    escape_cell(line["function"]),
                    escape_cell(line.get("frame_id")),
                    escape_cell(line.get("visual_anchor", "none")),
                    escape_cell(line["pause_after_ms"]),
                    escape_cell(line["text"]),
                ]
            )
            + " |"
        )

    rows.extend(["", "## Notes", "", "Non-spoken review notes only. Do not add spoken lines here."])
    out = run_dir / f"script_{args.lang}.md"
    out.write_text("\n".join(rows) + "\n", encoding="utf-8")
    print(out.as_posix())
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Export script_<lang>.md from episode_<lang>.json.")
    parser.add_argument("--run", required=True, help="Podcast run directory.")
    parser.add_argument("--lang", default="en", choices=["en", "zh"], help="Episode language suffix.")
    return parser


def main() -> int:
    return export(build_parser().parse_args())


if __name__ == "__main__":
    raise SystemExit(main())
