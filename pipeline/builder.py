from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
PROMPT_TEMPLATE_PATH = ROOT / "prompts" / "template.txt"


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_scenes() -> List[Dict[str, Any]]:
    return load_json(DATA_DIR / "scenes.json")


def load_characters() -> Dict[str, Dict[str, Any]]:
    return load_json(DATA_DIR / "characters.json")


def load_prompt_template() -> str:
    return PROMPT_TEMPLATE_PATH.read_text(encoding="utf-8")


def describe_character(name: str, c: Dict[str, Any]) -> str:
    visual = "，".join(c.get("visual_keywords", []))
    traits = "，".join(c.get("personality_keywords", []))
    items = "，".join(c.get("signature_items", []))
    return f"- {name}：视觉={visual}；气质={traits}；标志物={items}"


def build_prompt(scene: Dict[str, Any], characters: Dict[str, Dict[str, Any]], template: str | None = None) -> str:
    template = template or load_prompt_template()
    descs = []
    forbidden: List[str] = []
    scene_emphasis = scene.get("scene_emphasis", [])

    for name in scene["characters"]:
        c = characters[name]
        descs.append(describe_character(name, c))
        forbidden.extend(c.get("forbidden", []))

    emphasis_block = ""
    if scene_emphasis:
        emphasis_lines = "\n".join(f"- {item}" for item in scene_emphasis)
        emphasis_block = f"\n叙事重点：\n{emphasis_lines}\n"

    payload = {
        "title": scene["title"],
        "character_descriptions": "\n".join(descs),
        "location": scene["location"],
        "time": scene["time"],
        "action": scene["action"],
        "mood": scene["mood"],
        "shot_type": scene.get("shot_type", "medium"),
        "composition": scene.get("composition", "balanced"),
        "style_tags": "，".join(scene.get("style_tags", [])),
        "forbidden": "，".join(sorted(set(forbidden))),
        "scene_emphasis_block": emphasis_block,
    }
    return template.format(**payload).strip() + "\n"


def find_scene(scene_id: str, scenes: List[Dict[str, Any]]) -> Dict[str, Any]:
    for scene in scenes:
        if scene["id"] == scene_id:
            return scene
    raise KeyError(f"Scene not found: {scene_id}")
