from __future__ import annotations

from typing import Any

from tools.memory_tools import append_transcript_event, load_working_memory


def produce_passage(chapter_id: str, passage_id: str) -> dict[str, Any]:
    wm = load_working_memory()
    append_transcript_event({
        "type": "produce_passage_start",
        "chapter_id": chapter_id,
        "passage_id": passage_id
    })

    return {
        "chapter_id": chapter_id,
        "passage_id": passage_id,
        "status": "pipeline_stub_ready",
        "working_memory_loaded": bool(wm)
    }


if __name__ == "__main__":
    print(produce_passage("ch001", "p01"))
