#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

import requests


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ENV_FILES = [
    PROJECT_ROOT / ".env",
    PROJECT_ROOT / "site" / ".env",
]
DEFAULT_GENERATION_ENDPOINT = (
    "https://xcodeaiprovider.cognitiveservices.azure.com/openai/deployments/"
    "gpt-image-2/images/generations?api-version=2024-02-01"
)
DEFAULT_SIZE = "1024x1024"
DEFAULT_QUALITY = "low"
DEFAULT_FORMAT = "png"
DEFAULT_COMPRESSION = 100
DEFAULT_TIMEOUT = 300


def load_project_env() -> None:
    for env_path in DEFAULT_ENV_FILES:
        if not env_path.exists():
            continue
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip("'").strip('"'))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate or edit images with this project's Azure GPT Image deployment."
    )
    parser.add_argument("prompt", nargs="?", help="Image prompt or edit instruction.")
    parser.add_argument("--prompt-file", help="Read prompt from a UTF-8 text file.")
    parser.add_argument("--image", help="Image to edit. If omitted, text-to-image mode is used.")
    parser.add_argument("--mask", help="Optional mask image for edit mode.")
    parser.add_argument("--output", help="Output image path. For n > 1, files are suffixed.")
    parser.add_argument("--output-dir", default="output/azure-gpt-image", help="Default output directory.")
    parser.add_argument("--endpoint", help="Generation endpoint. Defaults to DEV.md Azure endpoint.")
    parser.add_argument("--api-key", help="API key. Defaults to AZURE_API_KEY.")
    parser.add_argument("--size", default=DEFAULT_SIZE, help=f"Image size. Default: {DEFAULT_SIZE}")
    parser.add_argument(
        "--quality",
        default=DEFAULT_QUALITY,
        choices=["low", "medium", "high", "auto"],
        help=f"Image quality. Default: {DEFAULT_QUALITY}",
    )
    parser.add_argument(
        "--format",
        default=DEFAULT_FORMAT,
        choices=["png", "jpeg", "webp"],
        help=f"Output format. Default: {DEFAULT_FORMAT}",
    )
    parser.add_argument(
        "--output-compression",
        type=int,
        default=DEFAULT_COMPRESSION,
        help=f"Output compression. Default: {DEFAULT_COMPRESSION}",
    )
    parser.add_argument("--n", type=int, default=1, help="Number of images. Default: 1")
    parser.add_argument("--metadata", action="store_true", help="Save raw API response JSON.")
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT)
    return parser


def resolve_prompt(args: argparse.Namespace) -> str:
    if args.prompt_file:
        prompt = Path(args.prompt_file).read_text(encoding="utf-8").strip()
    else:
        prompt = (args.prompt or "").strip()
    if not prompt:
        raise SystemExit("Prompt is empty. Pass a prompt or use --prompt-file.")
    return prompt


def resolve_api_key(args: argparse.Namespace) -> str:
    api_key = args.api_key or os.getenv("AZURE_API_KEY", "") or os.getenv("AZURE_OPENAI_API_KEY", "")
    if not api_key:
        raise SystemExit("Missing Azure API key. Set AZURE_API_KEY in .env or pass --api-key.")
    return api_key


def resolve_generation_endpoint(args: argparse.Namespace) -> str:
    return (
        args.endpoint
        or os.getenv("AZURE_GPT_IMAGE_ENDPOINT", "")
        or os.getenv("AZURE_OPENAI_IMAGE_ENDPOINT", "")
        or os.getenv("AZURE_IMAGE_ENDPOINT", "")
        or DEFAULT_GENERATION_ENDPOINT
    )


def edit_endpoint_from_generation(endpoint: str) -> str:
    if "api-version=2024-02-01" in endpoint:
        endpoint = endpoint.replace("api-version=2024-02-01", "api-version=2025-04-01-preview")
    if "/images/generations" in endpoint:
        return endpoint.replace("/images/generations", "/images/edits")
    if "/images/edits" in endpoint:
        return endpoint
    raise SystemExit(f"Endpoint is not an Azure image endpoint: {endpoint}")


def headers(api_key: str, *, multipart: bool = False) -> dict[str, str]:
    result = {"Authorization": f"Bearer {api_key}"}
    if not multipart:
        result["Content-Type"] = "application/json"
    return result


def generation_payload(args: argparse.Namespace, prompt: str) -> dict[str, Any]:
    return {
        "prompt": prompt,
        "size": args.size,
        "quality": args.quality,
        "output_compression": args.output_compression,
        "output_format": args.format,
        "n": args.n,
    }


def request_generation(endpoint: str, api_key: str, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    response = requests.post(endpoint, headers=headers(api_key), json=payload, timeout=timeout)
    if not response.ok:
        raise RuntimeError(f"Azure image generation failed: {response.status_code} {response.text}")
    return response.json()


def multipart_file(field_name: str, path: str) -> tuple[str, tuple[str, bytes, str]]:
    file_path = Path(path)
    mime = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    return field_name, (file_path.name, file_path.read_bytes(), mime)


def request_edit(endpoint: str, api_key: str, args: argparse.Namespace, prompt: str) -> dict[str, Any]:
    files = [multipart_file("image", args.image)]
    if args.mask:
        files.append(multipart_file("mask", args.mask))
    data: dict[str, str] = {
        "prompt": prompt,
        "size": args.size,
        "quality": args.quality,
        "output_compression": str(args.output_compression),
        "output_format": args.format,
        "n": str(args.n),
    }
    response = requests.post(
        edit_endpoint_from_generation(endpoint),
        headers=headers(api_key, multipart=True),
        data=data,
        files=files,
        timeout=args.timeout,
    )
    if not response.ok:
        raise RuntimeError(f"Azure image edit failed: {response.status_code} {response.text}")
    return response.json()


def slugify(text: str, limit: int = 48) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else "-" for ch in text)
    compact = "-".join(part for part in cleaned.split("-") if part)
    return (compact or "image")[:limit].rstrip("-") or "image"


def default_output_path(prompt: str, output_dir: str, image_format: str) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return Path(output_dir) / f"{timestamp}-{slugify(prompt)}.{image_format}"


def numbered_path(base: Path, index: int, total: int) -> Path:
    if total == 1:
        return base
    return base.with_name(f"{base.stem}-{index:02d}{base.suffix}")


def save_images(response: dict[str, Any], base_path: Path) -> list[Path]:
    data = response.get("data", [])
    if not data:
        raise RuntimeError(f"No image data returned: {json.dumps(response, ensure_ascii=False)}")

    paths: list[Path] = []
    for index, item in enumerate(data, start=1):
        b64_json = item.get("b64_json")
        if not b64_json:
            raise RuntimeError(f"Missing b64_json in response item #{index}: {item}")
        path = numbered_path(base_path, index, len(data))
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(base64.b64decode(b64_json))
        paths.append(path)
    return paths


def save_metadata(response: dict[str, Any], first_image: Path) -> Path:
    path = first_image.with_suffix(".json")
    path.write_text(json.dumps(response, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def main() -> int:
    args = build_parser().parse_args()
    load_project_env()
    prompt = resolve_prompt(args)
    api_key = resolve_api_key(args)
    endpoint = resolve_generation_endpoint(args)
    base_path = Path(args.output) if args.output else default_output_path(prompt, args.output_dir, args.format)

    if args.image:
        result = request_edit(endpoint, api_key, args, prompt)
    else:
        result = request_generation(endpoint, api_key, generation_payload(args, prompt), args.timeout)

    images = save_images(result, base_path)
    for image in images:
        print(f"saved image: {image}")
    if args.metadata:
        print(f"saved metadata: {save_metadata(result, images[0])}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("Cancelled.", file=sys.stderr)
        raise SystemExit(130)
