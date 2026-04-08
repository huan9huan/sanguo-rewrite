from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from pipeline.model_catalog import estimate_image_cost

ROOT = Path(__file__).resolve().parents[1]
COST_DIR = ROOT / "costs"
LEDGER_PATH = COST_DIR / "ledger.jsonl"


@dataclass
class CostEvent:
    timestamp: str
    run_dir: str
    scene_id: str
    engine: str
    provider: str
    model: str
    image_count: int
    estimated_cost: float | None
    currency: str | None
    latency_ms: int | None
    input_tokens: int | None
    output_tokens: int | None
    total_tokens: int | None


def record_cost_event(
    *,
    scene_id: str,
    run_dir: Path,
    engine: str,
    provider: str,
    model: str,
    image_count: int,
    estimated_cost: float | None,
    currency: str | None,
    latency_ms: int | None,
    input_tokens: int | None,
    output_tokens: int | None,
    total_tokens: int | None,
    timestamp: datetime | None = None,
) -> CostEvent:
    COST_DIR.mkdir(parents=True, exist_ok=True)
    event = CostEvent(
        timestamp=(timestamp or datetime.now()).isoformat(timespec="seconds"),
        run_dir=str(run_dir),
        scene_id=scene_id,
        engine=engine,
        provider=provider,
        model=model,
        image_count=image_count,
        estimated_cost=estimated_cost,
        currency=currency,
        latency_ms=latency_ms,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=total_tokens,
    )
    with LEDGER_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(asdict(event), ensure_ascii=False) + "\n")
    return event


def load_cost_events() -> List[Dict[str, Any]]:
    if not LEDGER_PATH.exists():
        return []
    events: List[Dict[str, Any]] = []
    with LEDGER_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            events.append(json.loads(line))
    return events


def summarize_costs(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    normalized_events: List[Dict[str, Any]] = []
    for event in events:
        normalized = dict(event)
        if normalized.get("estimated_cost") is None:
            estimated_cost, currency = estimate_image_cost(
                normalized["engine"],
                normalized["model"],
                int(normalized.get("image_count", 0)),
            )
            normalized["estimated_cost"] = estimated_cost
            normalized["currency"] = normalized.get("currency") or currency
        normalized_events.append(normalized)

    known_cost_events = [event for event in normalized_events if event.get("estimated_cost") is not None]
    currencies = sorted({event.get("currency") for event in known_cost_events if event.get("currency")})

    total_cost_by_currency: Dict[str, float] = {}
    for event in known_cost_events:
        currency = event["currency"]
        total_cost_by_currency[currency] = total_cost_by_currency.get(currency, 0.0) + float(event["estimated_cost"])

    total_images = sum(int(event.get("image_count", 0)) for event in normalized_events)
    total_input_tokens = sum(int(event.get("input_tokens", 0) or 0) for event in normalized_events)
    total_output_tokens = sum(int(event.get("output_tokens", 0) or 0) for event in normalized_events)
    total_tokens = sum(int(event.get("total_tokens", 0) or 0) for event in normalized_events)
    summary = {
        "run_count": len(normalized_events),
        "total_images": total_images,
        "total_input_tokens": total_input_tokens,
        "total_output_tokens": total_output_tokens,
        "total_tokens": total_tokens,
        "known_cost_run_count": len(known_cost_events),
        "unknown_cost_run_count": len(normalized_events) - len(known_cost_events),
        "total_cost_by_currency": total_cost_by_currency,
        "currencies": currencies,
        "events": normalized_events,
    }
    return summary
