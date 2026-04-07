from __future__ import annotations

from pathlib import Path
from typing import Dict


def score_image_placeholder(image_path: Path) -> Dict[str, int]:
    """占位评分器。

    当前先返回固定结构，后续可接入：
    - 角色一致性模型
    - 画面质量评分
    - OCR / 多模态理解检查
    """
    return {
        "character_consistency": 7,
        "readability": 8,
        "art_quality": 7,
        "overall": 7,
    }
