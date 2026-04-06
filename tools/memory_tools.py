from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]


def load_working_memory() -> dict[str, Any]:
    path = ROOT / "memory" / "working_memory.json"
    return json.loads(path.read_text(encoding="utf-8"))


def append_transcript_event(event: dict[str, Any]) -> None:
    path = ROOT / "memory" / "transcript.jsonl"
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")
