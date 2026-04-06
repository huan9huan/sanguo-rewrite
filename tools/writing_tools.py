from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def draft_path(chapter_id: str, passage_id: str, version: int = 1) -> Path:
    return ROOT / "story" / "drafts_cn" / f"{chapter_id}_{passage_id}_cn_v{version}.md"


def save_markdown(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
