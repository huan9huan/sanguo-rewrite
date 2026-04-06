from __future__ import annotations

import json
from pathlib import Path


def load_json(path: str | Path):
    path = Path(path)
    return json.loads(path.read_text(encoding="utf-8"))
