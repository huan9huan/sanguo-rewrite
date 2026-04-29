#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shlex
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parents[1]
DEFAULT_MANIFEST = ROOT / "asset_manifest_v1.json"
DEFAULT_PROMPT_DIR = ROOT / "prompts" / "v1"
DEFAULT_OUTPUT_DIR = ROOT / "generated" / "v1"

TOOL_BY_ENGINE = {
    "openai": PROJECT_ROOT / "tools" / "openai_text_to_image.py",
    "azure": PROJECT_ROOT / "tools" / "azure_gpt_image.py",
}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Prepare or run TYJY asset generation from asset_manifest_v1.json."
    )
    parser.add_argument(
        "--manifest",
        default=str(DEFAULT_MANIFEST),
        help=f"Asset manifest path. Default: {DEFAULT_MANIFEST}",
    )
    parser.add_argument(
        "--prompt-dir",
        default=str(DEFAULT_PROMPT_DIR),
        help=f"Directory for generated prompt files. Default: {DEFAULT_PROMPT_DIR}",
    )
    parser.add_argument(
        "--output-dir",
        default=str(DEFAULT_OUTPUT_DIR),
        help=f"Directory for generated images. Default: {DEFAULT_OUTPUT_DIR}",
    )
    parser.add_argument(
        "--engine",
        choices=sorted(TOOL_BY_ENGINE),
        default="openai",
        help="Image generation wrapper to target when printing or running commands.",
    )
    parser.add_argument(
        "--size-override",
        help="Override manifest size for all assets, for example 1024x1536.",
    )
    parser.add_argument(
        "--quality",
        default="medium",
        help="Quality passed through to the selected image tool. Default: medium",
    )
    parser.add_argument(
        "--asset",
        action="append",
        help="Only prepare selected asset id(s). Can be passed more than once.",
    )
    parser.add_argument(
        "--write-prompts",
        action="store_true",
        help="Write final prompt and negative prompt files.",
    )
    parser.add_argument(
        "--print-commands",
        action="store_true",
        help="Print shell commands that would generate every selected asset.",
    )
    parser.add_argument(
        "--run",
        action="store_true",
        help="Run the selected generator commands now.",
    )
    return parser


def load_manifest(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def filtered_assets(manifest: dict, requested_ids: list[str] | None) -> list[dict]:
    assets = manifest["assets"]
    if not requested_ids:
        return assets

    wanted = set(requested_ids)
    selected = [asset for asset in assets if asset["id"] in wanted]
    missing = wanted - {asset["id"] for asset in selected}
    if missing:
        raise SystemExit(f"Unknown asset id(s): {', '.join(sorted(missing))}")
    return selected


def final_prompt(style_prefix: str, asset: dict) -> str:
    negative = asset.get("negative_prompt", "").strip()
    lines = [
        style_prefix.strip(),
        asset["prompt"].strip(),
    ]
    if negative:
        lines.append(f"Avoid: {negative}")
    return "\n\n".join(lines).strip() + "\n"


def prompt_paths(prompt_dir: Path, asset_id: str) -> tuple[Path, Path]:
    return prompt_dir / f"{asset_id}.prompt.txt", prompt_dir / f"{asset_id}.negative.txt"


def write_prompt_files(prompt_dir: Path, style_prefix: str, assets: list[dict]) -> list[tuple[dict, Path]]:
    prompt_dir.mkdir(parents=True, exist_ok=True)
    written: list[tuple[dict, Path]] = []

    style_path = prompt_dir / "_style_prefix.txt"
    style_path.write_text(style_prefix.strip() + "\n", encoding="utf-8")

    for asset in assets:
        prompt_path, negative_path = prompt_paths(prompt_dir, asset["id"])
        prompt_path.write_text(final_prompt(style_prefix, asset), encoding="utf-8")
        negative_path.write_text(asset.get("negative_prompt", "").strip() + "\n", encoding="utf-8")
        written.append((asset, prompt_path))

    return written


def build_command(
    *,
    engine: str,
    prompt_path: Path,
    output_path: Path,
    size: str,
    quality: str,
) -> list[str]:
    tool_path = TOOL_BY_ENGINE[engine]
    return [
        "python3",
        str(tool_path),
        "--prompt-file",
        str(prompt_path),
        "--output",
        str(output_path),
        "--size",
        size,
        "--quality",
        quality,
    ]


def shell_line(parts: list[str]) -> str:
    return " ".join(shlex.quote(part) for part in parts)


def main() -> int:
    args = build_parser().parse_args()
    manifest_path = Path(args.manifest)
    prompt_dir = Path(args.prompt_dir)
    output_dir = Path(args.output_dir)

    manifest = load_manifest(manifest_path)
    assets = filtered_assets(manifest, args.asset)

    if not (args.write_prompts or args.print_commands or args.run):
        args.write_prompts = True
        args.print_commands = True

    prompt_files = write_prompt_files(prompt_dir, manifest["style_prefix"], assets)

    if args.write_prompts:
        print(f"Wrote prompt files to {prompt_dir}")

    commands: list[tuple[dict, list[str]]] = []
    for asset, prompt_path in prompt_files:
        output_path = output_dir / asset["filename"]
        output_path.parent.mkdir(parents=True, exist_ok=True)
        size = args.size_override or asset["size"]
        commands.append(
            (
                asset,
                build_command(
                    engine=args.engine,
                    prompt_path=prompt_path,
                    output_path=output_path,
                    size=size,
                    quality=args.quality,
                ),
            )
        )

    if args.print_commands:
        print("")
        print(f"# Engine: {args.engine}")
        for asset, command in commands:
            print(f"# {asset['id']}")
            print(shell_line(command))
            print("")

    if args.run:
        for asset, command in commands:
            print(f"Running {asset['id']} ...")
            subprocess.run(command, cwd=str(PROJECT_ROOT), check=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
