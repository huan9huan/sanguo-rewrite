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
    parser = argparse.ArgumentParser(description="Edit images with Doubao Seedream / SeedEdit.")
    parser.add_argument("prompt", nargs="?", help="Edit instruction.")
    parser.add_argument("--prompt-file", help="Read edit instruction from a file.")
    parser.add_argument("--image", action="append", required=True, help="Reference image path or URL. Repeatable.")
    parser.add_argument("--output", help="Output image path.")
    parser.add_argument("--output-dir", default="output/seedream-image-edit", help="Default output directory.")
    parser.add_argument("--api-key", help="ARK API key. Falls back to ARK_API_KEY.")
    parser.add_argument("--base-url", help="ARK base URL.")
    parser.add_argument("--model", default=None, help="Edit model. Defaults to ARK_IMAGE_EDIT_MODEL, then ARK_IMAGE_MODEL.")
    parser.add_argument("--size", default=None, help="Requested size, such as 2K or 1024x1024.")
    parser.add_argument("--n", type=int, default=1, help="Number of outputs. Default: 1")
    parser.add_argument("--response-format", default="b64_json", choices=["b64_json", "url"])
    parser.add_argument("--watermark", action="store_true", help="Enable watermark.")
    parser.add_argument("--metadata", action="store_true")
    parser.add_argument("--timeout", type=int, default=300)
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
    api_key = args.api_key or os.getenv("ARK_API_KEY", "")
    if not api_key:
        raise SystemExit("Missing ARK_API_KEY.")
    return api_key


def resolve_base_url(args: argparse.Namespace) -> str:
    return (args.base_url or os.getenv("ARK_BASE_URL", "") or DEFAULT_ARK_BASE_URL).rstrip("/")


def resolve_model(args: argparse.Namespace) -> str:
    return (
        args.model
        or os.getenv("ARK_IMAGE_EDIT_MODEL", "")
        or os.getenv("ARK_IMAGE_MODEL", "")
        or "doubao-seededit-3-0-i2i-250628"
    )


def image_input(value: str) -> str:
    if value.startswith("http://") or value.startswith("https://") or value.startswith("data:"):
        return value
    path = Path(value)
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


def build_payload(model: str, prompt: str, args: argparse.Namespace) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "model": model,
        "prompt": prompt,
        "image": [image_input(value) for value in args.image],
        "n": args.n,
        "response_format": args.response_format,
        "watermark": args.watermark,
    }
    if args.size:
        payload["size"] = args.size
    return payload


def request_edit(base_url: str, api_key: str, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
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
        raise RuntimeError(f"Seedream image edit failed: {response.status_code} {response.text}")
    return response.json()


def slugify(text: str, limit: int = 48) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else "-" for ch in text)
    compact = "-".join(part for part in cleaned.split("-") if part)
    return (compact or "image")[:limit].rstrip("-") or "image"


def default_output_path(prompt: str, output_dir: str) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return Path(output_dir) / f"{timestamp}-{slugify(prompt)}.png"


def numbered_path(base_path: Path, index: int, total: int) -> Path:
    if total == 1:
        return base_path
    return base_path.with_name(f"{base_path.stem}-{index:02d}{base_path.suffix}")


def save_item(item: dict[str, Any], output_path: Path) -> None:
    b64_json = item.get("b64_json")
    if b64_json:
        output_path.write_bytes(base64.b64decode(b64_json))
        return
    url = item.get("url")
    if url:
        response = requests.get(url, timeout=120)
        response.raise_for_status()
        output_path.write_bytes(response.content)
        return
    raise RuntimeError(f"Unsupported response item: {item}")


def save_outputs(result: dict[str, Any], base_path: Path) -> list[Path]:
    items = result.get("data", [])
    if not items:
        raise RuntimeError(f"No image data returned: {json.dumps(result, ensure_ascii=False)}")
    paths: list[Path] = []
    for index, item in enumerate(items, start=1):
        output_path = numbered_path(base_path, index, len(items))
        output_path.parent.mkdir(parents=True, exist_ok=True)
        save_item(item, output_path)
        paths.append(output_path)
    return paths


def save_metadata(result: dict[str, Any], image_path: Path) -> Path:
    metadata_path = image_path.with_suffix(".json")
    metadata_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata_path


def main() -> int:
    load_project_env()
    args = build_parser().parse_args()
    prompt = resolve_prompt(args)
    api_key = resolve_api_key(args)
    base_url = resolve_base_url(args)
    model = resolve_model(args)
    payload = build_payload(model, prompt, args)
    base_path = Path(args.output) if args.output else default_output_path(prompt, args.output_dir)
    result = request_edit(base_url, api_key, payload, args.timeout)
    saved_paths = save_outputs(result, base_path)
    for path in saved_paths:
        print(f"saved image: {path}")
    if args.metadata:
        metadata_path = save_metadata(result, saved_paths[0])
        print(f"saved metadata: {metadata_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("Cancelled.", file=sys.stderr)
        raise SystemExit(130)
