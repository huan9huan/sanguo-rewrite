from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
STORY_DIR = ROOT / "story"
MEMORY_DIR = ROOT / "memory"


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def load_passage_spec(chapter_id: str, passage_id: str) -> dict[str, Any]:
    return load_json(STORY_DIR / f"{chapter_id}-{passage_id}" / "spec.json")


def load_scene_specs(chapter_id: str, passage_id: str) -> list[dict[str, Any]]:
    passage_dir = STORY_DIR / f"{chapter_id}-{passage_id}"
    scene_paths = sorted(passage_dir.glob("s*-spec.json"))
    return [load_json(path) for path in scene_paths]


def load_character_memory() -> dict[str, Any]:
    return load_json(MEMORY_DIR / "character_memory.json")


def load_character_visuals() -> dict[str, Any]:
    path = MEMORY_DIR / "character_visuals.json"
    if not path.exists():
        return {}
    return load_json(path)


def _join_keywords(values: list[str] | None) -> list[str]:
    return [item.strip() for item in values or [] if item and item.strip()]


def _first_non_empty(*values: str | None) -> str:
    for value in values:
        if value and value.strip():
            return value.strip()
    return ""


def _infer_time(scene: dict[str, Any], passage_spec: dict[str, Any]) -> str:
    haystack = " ".join([
        scene.get("setting_cn", ""),
        scene.get("scene_goal_cn", ""),
        " ".join(passage_spec.get("emotion_curve", [])),
    ])
    if "夜" in haystack or "夜袭" in haystack:
        return "夜"
    if "晨" in haystack or "清晨" in haystack:
        return "晨"
    return "未明"


def _infer_shot_type(scene: dict[str, Any]) -> str:
    tension = float(scene.get("tension_level", 0) or 0)
    scene_type = scene.get("scene_type", "")
    if tension >= 0.85 or scene_type == "climax":
        return "wide action shot"
    if tension >= 0.6:
        return "medium dramatic shot"
    return "medium establishing shot"


def _infer_composition(scene: dict[str, Any]) -> str:
    scene_type = scene.get("scene_type", "")
    if scene_type == "climax":
        return "diagonal tension"
    if scene_type == "crisis":
        return "compressed foreground tension"
    return "balanced group composition"


def _build_scene_emphasis(scene: dict[str, Any], passage_spec: dict[str, Any]) -> list[str]:
    emphasis: list[str] = []
    emphasis.extend(_join_keywords(scene.get("must_include")))

    dramatic_question = passage_spec.get("dramatic_question_cn")
    if dramatic_question:
        emphasis.append(f"戏剧问题：{dramatic_question}")

    conflict = passage_spec.get("conflict_cn")
    if conflict:
        emphasis.append(f"冲突核心：{conflict}")

    return emphasis[:8]


def build_character_sheet(names: list[str], character_memory: dict[str, Any] | None = None) -> dict[str, dict[str, Any]]:
    memory = character_memory or load_character_memory()
    visuals = load_character_visuals()
    output: dict[str, dict[str, Any]] = {}

    for name in names:
        raw = memory.get(name, {})
        visual = visuals.get(name, {})
        established = raw.get("established_details", {})
        dynamic = raw.get("dynamic_state", {})
        visual_keywords = _join_keywords(visual.get("visual_keywords"))
        silhouette = visual.get("silhouette", {})
        face = visual.get("face", {})
        hair = visual.get("hair_and_headwear", {})
        facial_hair = visual.get("facial_hair", {})
        costume = visual.get("costume", {})
        visual_items = (
            visual_keywords
            + _join_keywords([silhouette.get("height"), silhouette.get("build"), silhouette.get("posture")])
            + _join_keywords([face.get("shape"), face.get("skin_tone")])
            + _join_keywords(face.get("features"))
            + _join_keywords([hair.get("hair"), hair.get("headwear")])
            + _join_keywords([facial_hair.get("style"), facial_hair.get("notes")])
            + _join_keywords([costume.get("base"), costume.get("outerwear")])
            + _join_keywords(costume.get("colors"))
        )
        signature_items = _join_keywords(visual.get("signature_items")) or _join_keywords(
            [established.get("weapons_cn"), established.get("action_shown_cn")]
        )
        forbidden_visuals = _join_keywords(visual.get("forbidden_visuals"))
        forbidden = forbidden_visuals + _join_keywords(raw.get("avoid"))
        output[name] = {
            "display_name_cn": visual.get("display_name_cn", name),
            "visual_keywords": visual_items or (
                _join_keywords(raw.get("core_traits"))
                + _join_keywords([established.get("appearance_cn"), established.get("weapons_cn")])
            ),
            "personality_keywords": _join_keywords(raw.get("core_traits"))
            + _join_keywords([dynamic.get("current_role"), dynamic.get("current_status_cn")]),
            "signature_items": signature_items,
            "forbidden": forbidden,
            "color_palette": _join_keywords(visual.get("color_palette")),
            "expression_default": visual.get("expression_default", ""),
        }

    return output


def build_scene_payload(scene: dict[str, Any], passage_spec: dict[str, Any]) -> dict[str, Any]:
    title = _first_non_empty(scene.get("purpose_cn"), scene.get("scene_goal_cn"), scene.get("scene_id"))
    action = _first_non_empty(scene.get("scene_goal_cn"), scene.get("purpose_cn"))
    mood = "，".join(passage_spec.get("emotion_curve", [])) or "紧张"

    return {
        "id": scene["scene_id"],
        "title": title,
        "characters": scene.get("characters", []),
        "location": scene.get("setting_cn", ""),
        "time": _infer_time(scene, passage_spec),
        "mood": mood,
        "action": action,
        "shot_type": _infer_shot_type(scene),
        "composition": _infer_composition(scene),
        "style_tags": ["historical fiction", "three kingdoms", "cinematic ink comic"],
        "scene_emphasis": _build_scene_emphasis(scene, passage_spec),
    }


def build_passage_illustration_bundle(chapter_id: str, passage_id: str) -> dict[str, Any]:
    passage_spec = load_passage_spec(chapter_id, passage_id)
    scene_specs = load_scene_specs(chapter_id, passage_id)
    character_memory = load_character_memory()

    character_names = sorted({name for scene in scene_specs for name in scene.get("characters", [])})
    characters = build_character_sheet(character_names, character_memory)
    scenes = [build_scene_payload(scene, passage_spec) for scene in scene_specs]

    return {
        "chapter_id": chapter_id,
        "passage_id": passage_id,
        "passage_title_cn": passage_spec.get("title_cn", ""),
        "source_passage_spec": f"story/{chapter_id}-{passage_id}/spec.json",
        "source_scene_specs": [f"story/{chapter_id}-{passage_id}/{scene['scene_id'].split('_')[-1].replace('s', 's0')}-spec.json" for scene in scene_specs],
        "source_character_visuals": "memory/character_visuals.json",
        "characters": characters,
        "scenes": scenes,
    }


if __name__ == "__main__":
    bundle = build_passage_illustration_bundle("cp001", "p05")
    print(json.dumps(bundle, ensure_ascii=False, indent=2))
