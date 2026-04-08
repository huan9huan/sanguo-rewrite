from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

ROOT = Path(__file__).resolve().parents[1]
MODEL_CATALOG_PATH = ROOT / "config" / "models.json"


def load_model_catalog() -> Dict[str, Dict[str, Any]]:
    return json.loads(MODEL_CATALOG_PATH.read_text(encoding="utf-8"))


def get_model_entry(engine: str, model: str) -> Dict[str, Any]:
    catalog = load_model_catalog()
    return catalog.get(engine, {}).get(model, {})


def estimate_image_cost(engine: str, model: str, image_count: int) -> tuple[float | None, str | None]:
    entry = get_model_entry(engine, model)
    pricing = entry.get("pricing", {})
    if pricing.get("unit") != "image" or pricing.get("price") is None:
        return None, pricing.get("currency")
    return float(pricing["price"]) * image_count, pricing.get("currency")
