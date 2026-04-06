from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]


def load_source_chapter(chapter_id: str) -> str:
    path = ROOT / "source" / "chapters" / f"{chapter_id}.txt"
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def build_passage_spec_template(chapter_id: str, passage_id: str) -> dict[str, Any]:
    return {
        "chapter_id": chapter_id,
        "passage_id": passage_id,
        "title_cn": "",
        "goal": "",
        "dramatic_question": "",
        "viewpoint_focus": [],
        "emotion_curve": [],
        "hook": "",
        "conflict": "",
        "turn": "",
        "ending_hook": "",
        "scene_ids": [],
        "status": "draft"
    }
