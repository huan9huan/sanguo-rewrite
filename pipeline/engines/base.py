from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List


@dataclass
class GenerateRequest:
    prompt: str
    n: int = 1
    size: str = "1024x1024"
    negative_prompt: str | None = None
    extra: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GeneratedImage:
    url: str | None = None
    revised_prompt: str | None = None
    local_path: str | None = None
    base64_data: str | None = None
    mime_type: str | None = None
    raw: Dict[str, Any] = field(default_factory=dict)


@dataclass
class UsageStats:
    generated_images: int = 0
    billed_units: float | None = None
    estimated_cost: float | None = None
    currency: str | None = None
    latency_ms: int | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None
    total_tokens: int | None = None


@dataclass
class GenerateResult:
    engine: str
    provider: str
    model: str
    images: List[GeneratedImage]
    usage: UsageStats = field(default_factory=UsageStats)
    raw_response: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ImageEngine(ABC):
    name: str
    provider: str
    default_model: str

    @abstractmethod
    def generate(self, request: GenerateRequest) -> GenerateResult:
        raise NotImplementedError
