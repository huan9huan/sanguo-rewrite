from __future__ import annotations

import json
import os
import subprocess
import time
from typing import Any, Dict, List

import requests

from .base import GenerateRequest, GenerateResult, GeneratedImage, ImageEngine, UsageStats


class NanoBananaEngine(ImageEngine):
    name = "nanobanana"
    provider = "google-ai-studio"
    default_model = "gemini-2.5-flash-image"

    def __init__(self) -> None:
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.base_url = os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta").rstrip("/")
        self.model = os.getenv("NANOBANANA_IMAGE_MODEL", self.default_model)
        self.aspect_ratio = os.getenv("NANOBANANA_ASPECT_RATIO", "1:1")
        self.timeout = int(os.getenv("REQUEST_TIMEOUT", "120"))
        if not self.api_key:
            raise RuntimeError("Missing GEMINI_API_KEY. Please set it in .env")

    def generate(self, request: GenerateRequest) -> GenerateResult:
        images: List[GeneratedImage] = []
        total_input_tokens = 0
        total_output_tokens = 0
        total_tokens = 0
        total_latency_ms = 0
        raw_responses: List[Dict[str, Any]] = []

        for _ in range(request.n):
            payload, generated_images, latency_ms = self._generate_once(request.prompt)
            raw_responses.append(payload)
            images.extend(generated_images)
            total_latency_ms += latency_ms

            usage_payload = payload.get("usageMetadata", {})
            total_input_tokens += int(usage_payload.get("promptTokenCount", 0) or 0)
            total_output_tokens += int(usage_payload.get("candidatesTokenCount", 0) or 0)
            total_tokens += int(usage_payload.get("totalTokenCount", 0) or 0)

        usage = UsageStats(
            generated_images=len(images),
            currency="USD",
            latency_ms=total_latency_ms,
            input_tokens=total_input_tokens or None,
            output_tokens=total_output_tokens or None,
            total_tokens=total_tokens or None,
        )

        return GenerateResult(
            engine=self.name,
            provider=self.provider,
            model=self.model,
            images=images,
            usage=usage,
            raw_response={"responses": raw_responses},
        )

    def _generate_once(self, prompt: str) -> tuple[Dict[str, Any], List[GeneratedImage], int]:
        body = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt,
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseModalities": ["IMAGE"],
                "imageConfig": {
                    "aspectRatio": self.aspect_ratio,
                },
            },
        }
        start = time.perf_counter()
        try:
            resp = requests.post(
                f"{self.base_url}/models/{self.model}:generateContent",
                headers=self._headers(),
                json=body,
                timeout=self.timeout,
            )
            latency_ms = int((time.perf_counter() - start) * 1000)
            if not resp.ok:
                print(f"[DEBUG] Status: {resp.status_code}")
                print(f"[DEBUG] URL: {resp.url}")
                print(f"[DEBUG] Response body: {resp.text}")
            resp.raise_for_status()
            payload = resp.json()
        except requests.exceptions.SSLError:
            payload, latency_ms = self._generate_once_with_curl(body)

        images: List[GeneratedImage] = []
        for candidate in payload.get("candidates", []):
            parts = candidate.get("content", {}).get("parts", [])
            for part in parts:
                inline_data = part.get("inlineData", {})
                if inline_data.get("data"):
                    images.append(
                        GeneratedImage(
                            raw=candidate,
                            base64_data=inline_data["data"],
                            mime_type=inline_data.get("mimeType", "image/png"),
                        )
                    )
        return payload, images, latency_ms

    def _generate_once_with_curl(self, body: Dict[str, Any]) -> tuple[Dict[str, Any], int]:
        start = time.perf_counter()
        proc = subprocess.run(
            [
                "curl",
                "-sS",
                "-X",
                "POST",
                f"{self.base_url}/models/{self.model}:generateContent",
                "-H",
                f"x-goog-api-key: {self.api_key}",
                "-H",
                "Content-Type: application/json",
                "--data-binary",
                "@-",
            ],
            input=json.dumps(body).encode("utf-8"),
            capture_output=True,
            check=False,
        )
        latency_ms = int((time.perf_counter() - start) * 1000)
        if proc.returncode != 0:
            raise RuntimeError(f"curl fallback failed: {proc.stderr.decode('utf-8', errors='replace')}")
        payload = json.loads(proc.stdout.decode("utf-8"))
        if "error" in payload:
            raise RuntimeError(f"Gemini API error via curl fallback: {payload}")
        return payload, latency_ms

    def _headers(self) -> Dict[str, str]:
        return {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json",
        }
