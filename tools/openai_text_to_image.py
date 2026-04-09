#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import json
import os
import mimetypes
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

import requests


DEFAULT_MODEL = "gpt-image-1.5"
DEFAULT_SIZE = "1024x1024"
DEFAULT_QUALITY = "medium"
DEFAULT_TIMEOUT = 300
API_URL = "https://api.openai.com/v1/images/generations"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate image(s) with OpenAI gpt-image-1.5 from a text prompt."
    )
    parser.add_argument("prompt", nargs="?", help="Text prompt for image generation.")
    parser.add_argument(
        "--prompt-file",
        help="Read prompt text from a file instead of the command line.",
    )
    parser.add_argument(
        "--output",
        help="Output image path. If n > 1, files will be suffixed automatically.",
    )
    parser.add_argument(
        "--image",
        action="append",
        help="Reference image path for image editing. Can be passed more than once.",
    )
    parser.add_argument(
        "--mask",
        help="Mask image path for image editing. Transparent areas are editable.",
    )
    parser.add_argument(
        "--output-dir",
        default="output/openai",
        help="Directory used when --output is not provided. Default: output/openai",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"OpenAI image model. Default: {DEFAULT_MODEL}",
    )
    parser.add_argument(
        "--size",
        default=DEFAULT_SIZE,
        help=f"Image size, for example 1024x1024. Default: {DEFAULT_SIZE}",
    )
    parser.add_argument(
        "--quality",
        default=DEFAULT_QUALITY,
        choices=["low", "medium", "high"],
        help=f"Image quality. Default: {DEFAULT_QUALITY}",
    )
    parser.add_argument(
        "--n",
        type=int,
        default=1,
        help="Number of images to generate. Default: 1",
    )
    parser.add_argument(
        "--format",
        default="png",
        choices=["png", "jpeg", "webp"],
        help="Image output format. Default: png",
    )
    parser.add_argument(
        "--metadata",
        action="store_true",
        help="Also save the raw API response as a JSON file.",
    )
    parser.add_argument(
        "--api-key",
        help="API key. Falls back to Azure or OpenAI environment variables.",
    )
    parser.add_argument(
        "--endpoint",
        help="Custom image generation endpoint. Useful for Azure OpenAI deployments.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=DEFAULT_TIMEOUT,
        help=f"HTTP timeout in seconds. Default: {DEFAULT_TIMEOUT}",
    )
    parser.add_argument(
        "--input-fidelity",
        choices=["low", "high"],
        help="Editing fidelity for reference images. Useful when preserving layout or identity.",
    )
    return parser


def resolve_prompt(args: argparse.Namespace) -> str:
    if args.prompt_file:
        prompt = Path(args.prompt_file).read_text(encoding="utf-8").strip()
    else:
        prompt = (args.prompt or "").strip()

    if not prompt:
        raise SystemExit("Prompt is empty. Pass text directly or use --prompt-file.")
    return prompt


def resolve_api_key(args: argparse.Namespace) -> str:
    api_key = (
        args.api_key
        or os.getenv("AZURE_API_KEY", "")
        or os.getenv("AZURE_OPENAI_API_KEY", "")
        or os.getenv("OPENAI_API_KEY", "")
    )
    if not api_key:
        raise SystemExit(
            "Missing API key. Export AZURE_API_KEY, AZURE_OPENAI_API_KEY, or OPENAI_API_KEY, or pass --api-key."
        )
    return api_key


def resolve_endpoint(args: argparse.Namespace) -> str:
    endpoint = (
        args.endpoint
        or os.getenv("AZURE_OPENAI_IMAGE_ENDPOINT", "")
        or os.getenv("OPENAI_IMAGE_ENDPOINT", "")
        or API_URL
    )
    return endpoint


def build_payload(args: argparse.Namespace, prompt: str) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "prompt": prompt,
        "size": args.size,
        "quality": args.quality,
        "n": args.n,
        "output_format": args.format,
    }
    if args.input_fidelity:
        payload["input_fidelity"] = args.input_fidelity
    if "openai.azure.com/" not in resolve_endpoint(args):
        payload["model"] = args.model
    return payload


def build_headers(endpoint: str, api_key: str, *, multipart: bool = False) -> Dict[str, str]:
    headers = {
        "Content-Type": "application/json",
    }
    if multipart:
        headers.pop("Content-Type", None)
    if "openai.azure.com/" in endpoint:
        headers["Authorization"] = f"Bearer {api_key}"
    else:
        headers["Authorization"] = f"Bearer {api_key}"
    return headers


def request_images(endpoint: str, api_key: str, payload: Dict[str, Any], timeout: int) -> Dict[str, Any]:
    response = requests.post(
        endpoint,
        headers=build_headers(endpoint, api_key),
        json=payload,
        timeout=timeout,
    )
    if not response.ok:
        message = response.text
        raise RuntimeError(f"OpenAI image request failed: {response.status_code} {message}")
    return response.json()


def request_image_edit(
    endpoint: str,
    api_key: str,
    payload: Dict[str, Any],
    image_paths: List[str],
    mask_path: str | None,
    timeout: int,
) -> Dict[str, Any]:
    edit_endpoint = endpoint.replace("/images/generations", "/images/edits")
    if "openai.azure.com/" in edit_endpoint and "api-version=2024-02-01" in edit_endpoint:
        edit_endpoint = edit_endpoint.replace("api-version=2024-02-01", "api-version=2025-04-01-preview")
    image_field = "image" if len(image_paths) == 1 else "image[]"
    files = [_multipart_file(image_field, image_path) for image_path in image_paths]
    if mask_path:
        files.append(_multipart_file("mask", mask_path))
    response = requests.post(
        edit_endpoint,
        headers=build_headers(edit_endpoint, api_key, multipart=True),
        data={k: str(v) for k, v in payload.items()},
        files=files,
        timeout=timeout,
    )
    if not response.ok:
        message = response.text
        raise RuntimeError(f"OpenAI image edit request failed: {response.status_code} {message}")
    return response.json()


def _multipart_file(field_name: str, file_path: str) -> tuple[str, tuple[str, bytes, str]]:
    path = Path(file_path)
    mime_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return (
        field_name,
        (
            path.name,
            path.read_bytes(),
            mime_type,
        ),
    )


def slugify(text: str, limit: int = 48) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else "-" for ch in text)
    compact = "-".join(part for part in cleaned.split("-") if part)
    return (compact or "image")[:limit].rstrip("-") or "image"


def default_output_path(prompt: str, output_dir: str, image_format: str) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    filename = f"{timestamp}-{slugify(prompt)}.{image_format}"
    return Path(output_dir) / filename


def numbered_path(base_path: Path, index: int, total: int) -> Path:
    if total == 1:
        return base_path
    return base_path.with_name(f"{base_path.stem}-{index:02d}{base_path.suffix}")


def save_images(payload: Dict[str, Any], base_path: Path) -> List[Path]:
    data = payload.get("data", [])
    if not data:
        raise RuntimeError(f"No image data returned: {json.dumps(payload, ensure_ascii=False)}")

    saved_paths: List[Path] = []
    for index, item in enumerate(data, start=1):
        image_base64 = item.get("b64_json")
        if not image_base64:
            raise RuntimeError(f"Missing b64_json in response item #{index}: {item}")
        output_path = numbered_path(base_path, index, len(data))
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(base64.b64decode(image_base64))
        saved_paths.append(output_path)
    return saved_paths


def save_metadata(payload: Dict[str, Any], image_path: Path) -> Path:
    metadata_path = image_path.with_suffix(".json")
    metadata_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return metadata_path


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    prompt = resolve_prompt(args)
    api_key = resolve_api_key(args)
    endpoint = resolve_endpoint(args)
    payload = build_payload(args, prompt)

    if args.output:
        base_path = Path(args.output)
    else:
        base_path = default_output_path(prompt, args.output_dir, args.format)

    if args.image:
        result = request_image_edit(endpoint, api_key, payload, args.image, args.mask, args.timeout)
    else:
        result = request_images(endpoint, api_key, payload, args.timeout)
    image_paths = save_images(result, base_path)

    for path in image_paths:
        print(f"saved image: {path}")

    if args.metadata:
        metadata_path = save_metadata(result, image_paths[0])
        print(f"saved metadata: {metadata_path}")

    revised_prompts = [item.get("revised_prompt") for item in result.get("data", []) if item.get("revised_prompt")]
    if revised_prompts:
        print("revised prompt:")
        print(revised_prompts[0])

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("Cancelled.", file=sys.stderr)
        raise SystemExit(130)
