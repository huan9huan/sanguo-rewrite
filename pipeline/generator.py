from __future__ import annotations

import json
import base64
from datetime import datetime
from pathlib import Path
from typing import List, Tuple

import requests

from pipeline.engines import GenerateResult

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output"


def save_image_from_url(url: str, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    resp = requests.get(url, timeout=120)
    resp.raise_for_status()
    path.write_bytes(resp.content)


def save_image_from_base64(base64_data: str, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(base64.b64decode(base64_data))


def _sanitize_path_token(value: str) -> str:
    allowed = []
    for char in value.strip():
        if char.isalnum() or char in {"-", "_", "."}:
            allowed.append(char)
        else:
            allowed.append("_")
    return "".join(allowed).strip("_") or "unknown"


def build_run_dir(scene_id: str, model: str, timestamp: datetime | None = None) -> Path:
    ts = (timestamp or datetime.now()).strftime("%Y%m%d-%H%M")
    folder_name = f"{_sanitize_path_token(scene_id)}+{_sanitize_path_token(model)}+{ts}"
    return OUTPUT_DIR / folder_name


def persist_prompt(scene_id: str, model: str, prompt: str, timestamp: datetime | None = None) -> Path:
    scene_dir = build_run_dir(scene_id, model, timestamp=timestamp)
    scene_dir.mkdir(parents=True, exist_ok=True)
    prompt_path = scene_dir / "prompt.txt"
    prompt_path.write_text(prompt, encoding="utf-8")
    return prompt_path


def persist_result(
    scene_id: str,
    prompt: str,
    result: GenerateResult,
    timestamp: datetime | None = None,
) -> Tuple[Path, List[Path]]:
    scene_dir = build_run_dir(scene_id, result.model, timestamp=timestamp)
    scene_dir.mkdir(parents=True, exist_ok=True)

    metadata = {
        "scene_id": scene_id,
        "prompt": prompt,
        "engine": result.engine,
        "provider": result.provider,
        "model": result.model,
        "result": result.to_dict(),
    }
    (scene_dir / "metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (scene_dir / "prompt.txt").write_text(prompt, encoding="utf-8")

    saved_paths: List[Path] = []
    for idx, item in enumerate(result.images, start=1):
        image_path = scene_dir / f"candidate_{idx}.png"
        if item.url:
            save_image_from_url(item.url, image_path)
        elif item.base64_data:
            save_image_from_base64(item.base64_data, image_path)
        else:
            continue
        item.local_path = str(image_path)
        saved_paths.append(image_path)

    if saved_paths:
        metadata["result"] = result.to_dict()
        (scene_dir / "metadata.json").write_text(
            json.dumps(metadata, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    return scene_dir, saved_paths
