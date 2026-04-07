from __future__ import annotations

from typing import Dict

from .base import ImageEngine
from .nanobanana import NanoBananaEngine
from .qwen import QwenImageEngine
from .seedream import SeedreamEngine


def create_engine(name: str) -> ImageEngine:
    engine_name = name.lower()
    if engine_name == "seedream":
        return SeedreamEngine()
    if engine_name == "nanobanana":
        return NanoBananaEngine()
    if engine_name == "qwen":
        return QwenImageEngine()
    raise KeyError(f"Unsupported engine: {name}")


def list_engines() -> Dict[str, str]:
    return {
        "seedream": "Volcengine Ark Seedream adapter",
        "nanobanana": "Google AI Studio Gemini image adapter",
        "qwen": "Alibaba DashScope Qwen image adapter",
    }
