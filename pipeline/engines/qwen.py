from __future__ import annotations

import os
import time
from typing import Any, Dict, List

import requests

from pipeline.model_catalog import estimate_image_cost

from .base import GenerateRequest, GenerateResult, GeneratedImage, ImageEngine, UsageStats


class QwenImageEngine(ImageEngine):
    name = "qwen"
    provider = "aliyun-dashscope"
    default_model = "qwen-image-2.0-pro"

    def __init__(self) -> None:
        self.api_key = os.getenv("QWEN_API_KEY", os.getenv("DASHSCOPE_API_KEY", ""))
        self.base_url = os.getenv("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/api/v1").rstrip("/")
        self.model = os.getenv("QWEN_IMAGE_MODEL", self.default_model)
        self.image_size = os.getenv("QWEN_IMAGE_SIZE", "2048*2048")
        self.timeout = int(os.getenv("REQUEST_TIMEOUT", "120"))
        self.poll_interval = float(os.getenv("QWEN_POLL_INTERVAL", "3"))
        self.poll_timeout = int(os.getenv("QWEN_POLL_TIMEOUT", "180"))
        self.prompt_extend = os.getenv("QWEN_PROMPT_EXTEND", "true").lower() == "true"
        self.watermark = os.getenv("QWEN_WATERMARK", "false").lower() == "true"
        if not self.api_key:
            raise RuntimeError("Missing QWEN_API_KEY or DASHSCOPE_API_KEY. Please set it in .env")

    def generate(self, request: GenerateRequest) -> GenerateResult:
        model = self.model
        if self._uses_async_api(model):
            return self._generate_async(request, model)
        return self._generate_sync(request, model)

    def _headers(self, async_mode: bool = False) -> Dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        if async_mode:
            headers["X-DashScope-Async"] = "enable"
        return headers

    def _resolve_size(self, requested_size: str | None) -> str:
        candidate = requested_size or self.image_size
        if "*" in candidate:
            return candidate
        return self.image_size

    def _parameters(self, request: GenerateRequest, allow_multi_image: bool) -> Dict[str, Any]:
        params: Dict[str, Any] = {
            "size": self._resolve_size(request.size),
            "prompt_extend": self.prompt_extend,
            "watermark": self.watermark,
        }
        if request.negative_prompt:
            params["negative_prompt"] = request.negative_prompt
        if allow_multi_image:
            params["n"] = request.n
        elif request.n != 1:
            raise ValueError("This Qwen image model only supports n=1.")
        params.update(request.extra)
        return params

    def _generate_sync(self, request: GenerateRequest, model: str) -> GenerateResult:
        body = {
            "model": model,
            "input": {
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "text": request.prompt,
                            }
                        ],
                    }
                ]
            },
            "parameters": self._parameters(request, allow_multi_image=True),
        }
        start = time.perf_counter()
        resp = requests.post(
            f"{self.base_url}/services/aigc/multimodal-generation/generation",
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

        images: List[GeneratedImage] = []
        for choice in payload.get("output", {}).get("choices", []):
            content = choice.get("message", {}).get("content", [])
            for item in content:
                image_url = item.get("image")
                if image_url:
                    images.append(GeneratedImage(url=image_url, raw=choice))

        usage_payload = payload.get("usage", {})
        estimated_cost, currency = estimate_image_cost(self.name, model, len(images))
        usage = UsageStats(
            generated_images=usage_payload.get("image_count", len(images)),
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
            model=model,
            images=images,
            usage=usage,
            raw_response=payload,
        )

    def _generate_async(self, request: GenerateRequest, model: str) -> GenerateResult:
        body = {
            "model": model,
            "input": {
                "prompt": request.prompt,
            },
            "parameters": self._parameters(request, allow_multi_image=False),
        }
        start = time.perf_counter()
        create_resp = requests.post(
            f"{self.base_url}/services/aigc/text2image/image-synthesis",
            headers=self._headers(async_mode=True),
            json=body,
            timeout=self.timeout,
        )
        if not create_resp.ok:
            print(f"[DEBUG] Status: {create_resp.status_code}")
            print(f"[DEBUG] URL: {create_resp.url}")
            print(f"[DEBUG] Response body: {create_resp.text}")
        create_resp.raise_for_status()
        create_payload = create_resp.json()

        task_id = create_payload.get("output", {}).get("task_id")
        if not task_id:
            raise RuntimeError(f"Qwen async image task did not return task_id: {create_payload}")

        payload = self._poll_task(task_id)
        latency_ms = int((time.perf_counter() - start) * 1000)
        output = payload.get("output", {})
        images = [
            GeneratedImage(
                url=item.get("url"),
                revised_prompt=item.get("actual_prompt"),
                raw=item,
            )
            for item in output.get("results", [])
            if item.get("url")
        ]

        usage_payload = payload.get("usage", {})
        estimated_cost, currency = estimate_image_cost(self.name, model, len(images))
        usage = UsageStats(
            generated_images=usage_payload.get("image_count", len(images)),
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
            model=model,
            images=images,
            usage=usage,
            raw_response={
                "create_task": create_payload,
                "poll_result": payload,
            },
        )

    def _poll_task(self, task_id: str) -> Dict[str, Any]:
        deadline = time.time() + self.poll_timeout
        task_url = f"{self.base_url}/tasks/{task_id}"
        last_payload: Dict[str, Any] | None = None

        while time.time() < deadline:
            resp = requests.get(task_url, headers=self._headers(), timeout=self.timeout)
            if not resp.ok:
                print(f"[DEBUG] Status: {resp.status_code}")
                print(f"[DEBUG] URL: {resp.url}")
                print(f"[DEBUG] Response body: {resp.text}")
            resp.raise_for_status()
            payload = resp.json()
            last_payload = payload
            status = payload.get("output", {}).get("task_status")
            if status == "SUCCEEDED":
                return payload
            if status in {"FAILED", "CANCELED", "UNKNOWN"}:
                raise RuntimeError(f"Qwen async image task failed with status {status}: {payload}")
            time.sleep(self.poll_interval)

        raise TimeoutError(f"Qwen async image task timed out after {self.poll_timeout}s: {last_payload}")

    @staticmethod
    def _uses_async_api(model: str) -> bool:
        return model in {"qwen-image", "qwen-image-plus", "qwen-image-plus-2026-01-09"}
