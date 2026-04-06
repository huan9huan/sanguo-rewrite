from __future__ import annotations

from typing import Any


def empty_review(target_draft_id: str) -> dict[str, Any]:
    return {
        "review_id": f"rr_{target_draft_id}",
        "target_draft_id": target_draft_id,
        "scores": {
            "clarity": 0.0,
            "story_drive": 0.0,
            "character_consistency": 0.0,
            "show_not_tell": 0.0,
            "translation_readiness": 0.0
        },
        "issues": [],
        "suggested_actions": []
    }
