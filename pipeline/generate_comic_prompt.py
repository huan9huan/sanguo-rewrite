from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_path(path_str: str | Path) -> Path:
    path = Path(path_str)
    if path.is_absolute():
        return path
    return (ROOT / path).resolve()


def load_spec(spec_path: str | Path) -> tuple[Path, dict[str, Any]]:
    path = resolve_path(spec_path)
    return path, load_json(path)


def build_page_prompt(spec: dict[str, Any]) -> str:
    title = spec.get("title_cn", "")
    comic_goal = spec.get("comic_goal_cn", "")
    page_format = spec.get("page_format", {})
    style = spec.get("style", {})
    panels = spec.get("panels", [])
    adaptation_rules = spec.get("adaptation_rules", [])

    lines: list[str] = []
    lines.append(f"做一页《{title}》的连环画页面。")
    if comic_goal:
        lines.append(comic_goal)
    lines.append("")
    lines.append("页面要求：")
    lines.append(f"- 共 {page_format.get('panel_count', len(panels))} 个 frame")
    if page_format.get("layout_pattern"):
        lines.append(f"- 版式：{page_format['layout_pattern']}")
    lines.append("- 适合 mobile 竖屏阅读")
    lines.append("- 每个 frame 只画图，不要在图中生成任何文字")
    lines.append("- 文字说明放在 frame 下方，由前端单独渲染")
    lines.append("")
    lines.append("整体画风：")
    if style.get("prompt_cn"):
        lines.append(style["prompt_cn"])
    lines.append("")
    if adaptation_rules:
        lines.append("改编规则：")
        lines.extend(f"- {rule}" for rule in adaptation_rules)
        lines.append("")
    lines.append("逐格要求：")
    for index, panel in enumerate(panels, start=1):
        lines.append(f"第 {index} 格：")
        lines.append(f"- 故事功能：{panel.get('story_function', '')}")
        lines.append(f"- 要画的瞬间：{panel.get('moment_cn', '')}")
        if panel.get("camera_cn"):
            lines.append(f"- 镜头：{panel['camera_cn']}")
        if panel.get("image_prompt_cn"):
            lines.append(f"- 画面提示：{panel['image_prompt_cn']}")
        must_show = panel.get("must_show", [])
        if must_show:
            lines.append("- 必须出现：")
            lines.extend(f"  - {item}" for item in must_show)
        must_avoid = panel.get("must_avoid", [])
        if must_avoid:
            lines.append("- 必须避免：")
            lines.extend(f"  - {item}" for item in must_avoid)
        lines.append("- 这一格图像必须无字，预留给下方文字说明，不要在画中留对白框。")
        lines.append("")
    negative_prompt = style.get("negative_prompt", "")
    if negative_prompt:
        lines.append("避免项：")
        lines.append(negative_prompt)
    return "\n".join(lines).strip() + "\n"


def build_frames_summary(spec: dict[str, Any]) -> dict[str, Any]:
    return {
        "page_id": spec.get("page_id"),
        "title_cn": spec.get("title_cn"),
        "panel_count": len(spec.get("panels", [])),
        "frames": [
            {
                "frame_id": panel.get("panel_id"),
                "scene_id": panel.get("scene_id"),
                "moment_cn": panel.get("moment_cn"),
                "camera_cn": panel.get("camera_cn"),
                "text_count": len(panel.get("text_slots", [])),
            }
            for panel in spec.get("panels", [])
        ],
    }


def output_dir_for_spec(spec_path: Path) -> Path:
    stem = spec_path.stem.replace("_spec", "")
    return spec_path.parent / f"{stem}_generated"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a layout-friendly comic page prompt from a passage comic spec.")
    parser.add_argument("spec", help="Path to passage_comic_spec_vN.json")
    parser.add_argument(
        "--print",
        action="store_true",
        help="Print the generated prompt to stdout as well as writing files.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    spec_path, spec = load_spec(args.spec)
    out_dir = output_dir_for_spec(spec_path)
    out_dir.mkdir(parents=True, exist_ok=True)

    prompt = build_page_prompt(spec)
    prompt_path = out_dir / "page_prompt.txt"
    prompt_path.write_text(prompt, encoding="utf-8")

    summary = build_frames_summary(spec)
    summary_path = out_dir / "frames_summary.json"
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    result = {
        "spec": str(spec_path),
        "prompt_path": str(prompt_path),
        "summary_path": str(summary_path),
    }

    if args.print:
        print(prompt)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
