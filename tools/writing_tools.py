from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def passage_dir(chapter_id: str, passage_id: str) -> Path:
    return ROOT / "story" / f"{chapter_id}-{passage_id}"


def draft_path(chapter_id: str, passage_id: str, version: int = 1) -> Path:
    return passage_dir(chapter_id, passage_id) / f"draft_cn_v{version}.md"


def save_markdown(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
