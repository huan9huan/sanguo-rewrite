#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

import requests


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_ENV_FILES = [
    PROJECT_ROOT / ".env",
    PROJECT_ROOT / "site" / ".env",
]
DEFAULT_QWEN_API_BASE_URL = "https://dashscope.aliyuncs.com/api/v1"
DEFAULT_ARK_BASE_URL = "https://ark.cn-beijing.volces.com"


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
    parser = argparse.ArgumentParser(description="Extract a character asset using Qwen or Seedream.")
    parser.add_argument("--engine", choices=["qwen", "seedream"], default="qwen")
    parser.add_argument("--image", required=True, help="Source image path.")
    parser.add_argument("--instruction", help="Target character extraction instruction.")
    parser.add_argument("--prompt-file", help="Read extraction instruction from a file.")
    parser.add_argument(
        "--asset-mode",
        choices=["portrait", "fullbody"],
        default="portrait",
        help="Character asset framing. Default: portrait",
    )
    parser.add_argument("--output", required=True, help="Output PNG path.")
    parser.add_argument("--output-dir", default="output/character-cutout", help="Default output directory.")
    parser.add_argument("--api-key", help="Override API key.")
    parser.add_argument("--model", help="Override model name.")
    parser.add_argument("--metadata", action="store_true")
    parser.add_argument("--timeout", type=int, default=300)
    return parser


def resolve_instruction(args: argparse.Namespace) -> str:
    if args.prompt_file:
        instruction = Path(args.prompt_file).read_text(encoding="utf-8").strip()
    else:
        instruction = (args.instruction or "").strip()
    if not instruction:
        raise SystemExit("Missing instruction. Pass --instruction or --prompt-file.")
    if args.asset_mode == "portrait":
        template = (
            f"{instruction}\n\n"
            "Preserve the exact face, expression, hair, beard, and identity of the chosen character from the source image. "
            "Frame the result as a portrait, bust, or big headshot. "
            "Do not emphasize action pose, weapons, or full clothing. "
            "Keep costume detail minimal and secondary to the face. "
            "Remove all other people, vehicles, props, and background scene. "
            "Keep only the chosen character as a clean portrait asset. "
            "Output transparent background if possible; otherwise use a clean pure white background with no shadows. "
            "Do not redesign the character or change identity."
        )
    else:
        template = (
            f"{instruction}\n\n"
            "Preserve the exact appearance, clothing, and face of the chosen character from the source image. "
            "Remove all other people, vehicles, props, and background scene. "
            "Keep only the chosen character as a standalone asset. "
            "Output transparent background if possible; otherwise use a clean pure white background with no shadows. "
            "Do not redesign the character or change identity."
        )
    return template


def data_url_for_image(file_path: str) -> str:
    path = Path(file_path)
    suffix = path.suffix.lower()
    mime = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".bmp": "image/bmp",
        ".gif": "image/gif",
        ".tif": "image/tiff",
        ".tiff": "image/tiff",
    }.get(suffix, "application/octet-stream")
    encoded = base64.b64encode(path.read_bytes()).decode("utf-8")
    return f"data:{mime};base64,{encoded}"


def request_qwen(image_path: str, prompt: str, api_key: str, model: str, timeout: int) -> dict[str, Any]:
    content = [
        {"image": data_url_for_image(image_path)},
        {"text": prompt},
    ]
    payload = {
        "model": model,
        "input": {
            "messages": [
                {
                    "role": "user",
                    "content": content,
                }
            ]
        },
        "parameters": {
            "n": 1,
            "watermark": False,
            "prompt_extend": True,
        },
    }
    response = requests.post(
        f"{os.getenv('QWEN_BASE_URL', DEFAULT_QWEN_API_BASE_URL).rstrip('/')}/services/aigc/multimodal-generation/generation",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=timeout,
    )
    if not response.ok:
        raise RuntimeError(f"Qwen character cutout failed: {response.status_code} {response.text}")
    return response.json()


def request_seedream(image_path: str, prompt: str, api_key: str, model: str, timeout: int) -> dict[str, Any]:
    payload = {
        "model": model,
        "prompt": prompt,
        "image": [data_url_for_image(image_path)],
        "n": 1,
        "response_format": "b64_json",
        "watermark": False,
    }
    base_url = os.getenv("ARK_BASE_URL", DEFAULT_ARK_BASE_URL).rstrip("/")
    response = requests.post(
        f"{base_url}/api/v3/images/generations",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=timeout,
    )
    if not response.ok:
        raise RuntimeError(f"Seedream character cutout failed: {response.status_code} {response.text}")
    return response.json()


def save_qwen_output(result: dict[str, Any], output_path: Path) -> None:
    choices = result.get("output", {}).get("choices", [])
    if not choices:
        raise RuntimeError(f"No image output returned: {json.dumps(result, ensure_ascii=False)}")
    content = choices[0].get("message", {}).get("content", [])
    image_item = next((part for part in content if part.get("image")), None)
    if not image_item:
        raise RuntimeError(f"No image content returned: {choices[0]}")
    save_image_from_item(image_item, output_path)


def save_seedream_output(result: dict[str, Any], output_path: Path) -> None:
    items = result.get("data", [])
    if not items:
        raise RuntimeError(f"No image output returned: {json.dumps(result, ensure_ascii=False)}")
    save_image_from_item(items[0], output_path)


def save_image_from_item(item: dict[str, Any], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    b64_json = item.get("b64_json")
    if b64_json:
        output_path.write_bytes(base64.b64decode(b64_json))
        return
    url = item.get("url") or item.get("image")
    if url:
        response = requests.get(url, timeout=120)
        response.raise_for_status()
        output_path.write_bytes(response.content)
        return
    raise RuntimeError(f"Unsupported image item: {item}")


def default_output_path(output_dir: str) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return Path(output_dir) / f"character-cutout-{timestamp}.png"


def save_metadata(metadata_path: Path, payload: dict[str, Any]) -> None:
    metadata_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    load_project_env()
    args = build_parser().parse_args()
    prompt = resolve_instruction(args)
    image_path = Path(args.image)
    output_path = Path(args.output) if args.output else default_output_path(args.output_dir)

    if args.engine == "qwen":
        api_key = args.api_key or os.getenv("QWEN_API_KEY", "") or os.getenv("DASHSCOPE_API_KEY", "")
        if not api_key:
            raise SystemExit("Missing QWEN_API_KEY or DASHSCOPE_API_KEY.")
        model = args.model or os.getenv("QWEN_IMAGE_MODEL", "") or "qwen-image-2.0-pro"
        result = request_qwen(str(image_path), prompt, api_key, model, args.timeout)
        save_qwen_output(result, output_path)
    else:
        api_key = args.api_key or os.getenv("ARK_API_KEY", "")
        if not api_key:
            raise SystemExit("Missing ARK_API_KEY.")
        model = args.model or os.getenv("ARK_IMAGE_MODEL", "") or "doubao-seedream-5-0-260128"
        result = request_seedream(str(image_path), prompt, api_key, model, args.timeout)
        save_seedream_output(result, output_path)

    print(f"saved character asset: {output_path}")
    if args.metadata:
        metadata_path = output_path.with_suffix(".json")
        save_metadata(
            metadata_path,
            {
                "engine": args.engine,
                "asset_mode": args.asset_mode,
                "source_image": str(image_path),
                "output": str(output_path),
                "instruction": prompt,
            },
        )
        print(f"saved metadata: {metadata_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("Cancelled.", file=sys.stderr)
        raise SystemExit(130)
