from __future__ import annotations

from .base import GenerateRequest, GenerateResult, ImageEngine


class StubEngine(ImageEngine):
    def __init__(self, name: str, provider: str, default_model: str) -> None:
        self.name = name
        self.provider = provider
        self.default_model = default_model
        self.model = default_model

    def generate(self, request: GenerateRequest) -> GenerateResult:
        raise NotImplementedError(
            f"Engine '{self.name}' is scaffolded but not implemented yet. "
            "Add the provider-specific API adapter before using it."
        )
