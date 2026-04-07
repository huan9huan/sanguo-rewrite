from __future__ import annotations

import os
import time
from typing import Any, Dict, List

import requests

from .base import GenerateRequest, GenerateResult, GeneratedImage, ImageEngine, UsageStats
from pipeline.model_catalog import estimate_image_cost


class SeedreamEngine(ImageEngine):
    name = "seedream"
    provider = "volcengine-ark"
    default_model = "doubao-seedream-5.0-lite"

    def __init__(self) -> None:
        self.api_key = os.getenv("ARK_API_KEY", "")
        self.base_url = os.getenv("ARK_BASE_URL", "https://ark.cn-beijing.volces.com").rstrip("/")
        self.model = os.getenv("ARK_IMAGE_MODEL", self.default_model)
        self.image_size = os.getenv("IMAGE_SIZE", "1024x1024")
        self.timeout = int(os.getenv("REQUEST_TIMEOUT", "120"))
        if not self.api_key:
            raise RuntimeError("Missing ARK_API_KEY. Please set it in .env")

    @property
    def endpoint(self) -> str:
        return f"{self.base_url}/api/v3/images/generations"

    def generate(self, request: GenerateRequest) -> GenerateResult:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        body: Dict[str, Any] = {
            "model": self.model,
            "prompt": request.prompt,
            "size": request.size or self.image_size,
            "n": request.n,
        }
        if request.negative_prompt:
            body["negative_prompt"] = request.negative_prompt
        body.update(request.extra)

        start = time.perf_counter()
        resp = requests.post(self.endpoint, headers=headers, json=body, timeout=self.timeout)
        latency_ms = int((time.perf_counter() - start) * 1000)
        if not resp.ok:
            print(f"[DEBUG] Status: {resp.status_code}")
            print(f"[DEBUG] URL: {resp.url}")
            print(f"[DEBUG] Response body: {resp.text}")
        resp.raise_for_status()
        payload = resp.json()

        images: List[GeneratedImage] = []
        for item in payload.get("data", []):
            images.append(
                GeneratedImage(
                    url=item.get("url"),
                    revised_prompt=item.get("revised_prompt"),
                    raw=item,
                )
            )

        usage_payload = payload.get("usage", {})
        estimated_cost, currency = estimate_image_cost(self.name, body["model"], len(images))
        usage = UsageStats(
            generated_images=usage_payload.get("generated_images", len(images)),
            estimated_cost=estimated_cost,
            currency=currency,
            latency_ms=latency_ms,
            input_tokens=usage_payload.get("input_tokens"),
            output_tokens=usage_payload.get("output_tokens"),
            total_tokens=usage_payload.get("total_tokens"),
        )

        return GenerateResult(
            engine=self.name,
            provider=self.provider,
            model=body["model"],
            images=images,
            usage=usage,
            raw_response=payload,
        )
