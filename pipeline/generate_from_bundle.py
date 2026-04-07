from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from pipeline.engines import GenerateRequest, create_engine
from pipeline.env_utils import load_dotenv_if_present
from pipeline.generator import persist_prompt, persist_result
from pipeline.story_adapter import build_character_sheet


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _dedupe_csv_parts(*parts: str) -> str:
    seen: set[str] = set()
    output: list[str] = []
    for part in parts:
        for token in part.split(","):
            value = token.strip()
            if not value or value in seen:
                continue
            seen.add(value)
            output.append(value)
    return ", ".join(output)


def load_bundle(bundle_path: str | Path) -> dict[str, Any]:
    path = Path(bundle_path)
    if not path.is_absolute():
        path = ROOT / path
    return load_json(path)


def resolve_path(path_str: str | Path, base_dir: Path) -> Path:
    path = Path(path_str)
    if path.is_absolute():
        return path
    return (base_dir / path).resolve()


def load_scene_character_ids(bundle_path: Path, scene: dict[str, Any]) -> list[str]:
    source_spec_file = scene.get("source_spec_file")
    if not source_spec_file:
        return []
    scene_spec_path = resolve_path(source_spec_file, bundle_path.parent)
    if not scene_spec_path.exists():
        return []
    scene_spec = load_json(scene_spec_path)
    return scene_spec.get("characters", [])


def format_character_block(character_ids: list[str]) -> str:
    if not character_ids:
        return ""
    characters = build_character_sheet(character_ids)
    lines = ["人物视觉锚点："]
    for character_id in character_ids:
        character = characters.get(character_id, {})
        display_name = character.get("display_name_cn", character_id)
        visual_keywords = ", ".join(character.get("visual_keywords", [])[:6])
        expression_default = character.get("expression_default", "")
        signature_items = ", ".join(character.get("signature_items", [])[:1])
        parts = [f"{display_name}: {visual_keywords}"]
        if expression_default:
            parts.append(f"默认表情气质: {expression_default}")
        if signature_items:
            parts.append(f"标志物: {signature_items}")
        lines.append("- " + "; ".join(parts))
    return "\n".join(lines)


def select_scenes(bundle: dict[str, Any], scene_ids: list[str] | None = None) -> list[dict[str, Any]]:
    scenes = bundle.get("scenes", [])
    if not scene_ids:
        return scenes
    wanted = set(scene_ids)
    selected = [scene for scene in scenes if scene.get("scene_id") in wanted]
    missing = sorted(wanted - {scene.get("scene_id") for scene in selected})
    if missing:
        raise KeyError(f"Scene ids not found in bundle: {', '.join(missing)}")
    return selected


def build_scene_prompt(
    bundle_path: Path,
    scene: dict[str, Any],
    style_strategy: dict[str, Any],
    prompt_language: str,
    candidate_key: str | None = None,
) -> tuple[str, str]:
    recommended = candidate_key or scene.get("recommended_candidate")
    candidate_angles = scene.get("candidate_angles", {})
    angle_note = candidate_angles.get(recommended, "")
    shared_tags = style_strategy.get("shared_style_tags", [])
    consistency_rules = style_strategy.get("consistency_rules", [])
    use_cn_labels = prompt_language == "cn"

    base_prompt = ""
    if prompt_language == "cn":
        base_prompt = scene.get("production_prompt_cn", "").strip() or scene.get("production_prompt_en", "").strip()
    elif prompt_language == "en":
        base_prompt = scene.get("production_prompt_en", "").strip() or scene.get("production_prompt_cn", "").strip()
    else:
        cn_prompt = scene.get("production_prompt_cn", "").strip()
        en_prompt = scene.get("production_prompt_en", "").strip()
        base_prompt = "\n\n".join(part for part in [cn_prompt, en_prompt] if part)

    prompt_sections = [base_prompt]
    if recommended and angle_note:
        if use_cn_labels:
            prompt_sections.append(f"推荐镜头：候选 {recommended}。{angle_note}")
        else:
            prompt_sections.append(f"Preferred framing: Candidate {recommended}. {angle_note}.")
    if shared_tags:
        if use_cn_labels:
            prompt_sections.append(f"本组统一风格标签：{', '.join(shared_tags)}")
        else:
            prompt_sections.append(f"Shared series style tags: {', '.join(shared_tags)}.")
    character_ids = load_scene_character_ids(bundle_path, scene)
    character_block = format_character_block(character_ids)
    if character_block:
        prompt_sections.append(character_block)
    if consistency_rules:
        prompt_sections.append("人物一致性规则：" if use_cn_labels else "Character consistency rules:")
        prompt_sections.extend(f"- {rule}" for rule in consistency_rules)

    prompt = "\n\n".join(section for section in prompt_sections if section).strip()
    negative = _dedupe_csv_parts(
        style_strategy.get("shared_negative_prompt", ""),
        scene.get("negative_prompt", ""),
    )
    return prompt, negative


def write_bundle_context(
    scene_dir: Path,
    bundle_path: Path,
    scene: dict[str, Any],
    prompt: str,
    negative_prompt: str,
    candidate_key: str | None,
    engine_name: str,
    num_candidates: int,
    dry_run: bool,
) -> Path:
    payload = {
        "bundle_file": str(bundle_path),
        "scene_id": scene.get("scene_id"),
        "title_cn": scene.get("title_cn"),
        "brief_file": scene.get("brief_file"),
        "source_spec_file": scene.get("source_spec_file"),
        "purpose": scene.get("purpose"),
        "recommended_candidate": scene.get("recommended_candidate"),
        "selected_candidate": candidate_key or scene.get("recommended_candidate"),
        "engine": engine_name,
        "num_candidates": num_candidates,
        "dry_run": dry_run,
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "review_focus": scene.get("review_focus", []),
    }
    path = scene_dir / "bundle_context.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def run_scene(
    bundle_path: Path,
    scene: dict[str, Any],
    style_strategy: dict[str, Any],
    engine_name: str,
    size: str,
    num_candidates: int,
    prompt_language: str,
    candidate_key: str | None,
    dry_run: bool,
) -> dict[str, Any]:
    prompt, negative_prompt = build_scene_prompt(
        bundle_path,
        scene,
        style_strategy,
        prompt_language=prompt_language,
        candidate_key=candidate_key,
    )

    if dry_run:
        prompt_path = persist_prompt(scene["scene_id"], "dry-run", prompt)
        context_path = write_bundle_context(
            prompt_path.parent,
            bundle_path,
            scene,
            prompt,
            negative_prompt,
            candidate_key,
            engine_name,
            num_candidates,
            dry_run=True,
        )
        return {
            "scene_id": scene["scene_id"],
            "mode": "dry-run",
            "prompt_path": str(prompt_path),
            "context_path": str(context_path),
        }

    engine = create_engine(engine_name)
    request = GenerateRequest(
        prompt=prompt,
        n=num_candidates,
        size=size or "",
        negative_prompt=negative_prompt or None,
    )
    result = engine.generate(request)
    scene_dir, image_paths = persist_result(scene["scene_id"], prompt, result)
    context_path = write_bundle_context(
        scene_dir,
        bundle_path,
        scene,
        prompt,
        negative_prompt,
        candidate_key,
        engine_name,
        num_candidates,
        dry_run=False,
    )
    return {
        "scene_id": scene["scene_id"],
        "mode": "generate",
        "engine": result.engine,
        "model": result.model,
        "scene_dir": str(scene_dir),
        "context_path": str(context_path),
        "images": [str(path) for path in image_paths],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate image prompts or outputs from an illustration bundle.")
    parser.add_argument("bundle", help="Path to illustration_bundle_vN.json")
    parser.add_argument(
        "--scene",
        dest="scene_ids",
        action="append",
        help="Scene id to run. Repeat the flag to run multiple scenes. Defaults to all scenes in the bundle.",
    )
    parser.add_argument(
        "--candidate-key",
        choices=["A", "B", "C"],
        help="Override the recommended candidate angle for every selected scene.",
    )
    parser.add_argument(
        "--engine",
        default=None,
        help="Image engine name. Defaults to seedream.",
    )
    parser.add_argument(
        "--size",
        default=None,
        help="Requested image size. Leave unset to let the engine use its own configured default, such as IMAGE_SIZE=2K for Seedream.",
    )
    parser.add_argument(
        "--num-candidates",
        type=int,
        default=None,
        help="Number of candidates per scene. Defaults to 3.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only persist prompt and bundle context without calling the engine.",
    )
    parser.add_argument(
        "--prompt-language",
        choices=["cn", "en", "hybrid"],
        default="cn",
        help="Language used for the scene description portion of the prompt. Defaults to cn for easier debugging.",
    )
    return parser.parse_args()


def main() -> None:
    load_dotenv_if_present()
    args = parse_args()
    bundle_path = Path(args.bundle)
    if not bundle_path.is_absolute():
        bundle_path = ROOT / bundle_path

    bundle = load_bundle(bundle_path)
    style_strategy = bundle.get("style_strategy", {})
    defaults = bundle.get("generation_defaults", {})
    engine_name = args.engine or defaults.get("engine", "seedream")
    size = args.size
    num_candidates = args.num_candidates or defaults.get("num_candidates", 3)

    results = []
    for scene in select_scenes(bundle, args.scene_ids):
        result = run_scene(
            bundle_path=bundle_path,
            scene=scene,
            style_strategy=style_strategy,
            engine_name=engine_name,
            size=size,
            num_candidates=num_candidates,
            prompt_language=args.prompt_language,
            candidate_key=args.candidate_key,
            dry_run=args.dry_run,
        )
        results.append(result)

    print(json.dumps({"bundle": str(bundle_path), "results": results}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
