---
name: azure-gpt-image
description: Use when working inside this project and the user wants to generate an image from text with the project's Azure GPT image workflow, or edit an existing image with a reference image, text instruction, and optional mask. Especially useful for comic iteration, layout-preserving fixes, and prompt-driven image refinement.
---

# Azure GPT Image

## Overview

Use this skill for the project's Azure GPT Image 2 workflow from `DEV.md`:

- text-to-image generation
- reference-image editing
- masked local edits that preserve most of the original image

Prefer this skill when the user wants to keep an existing comic page structure and only repair or refine part of an image.

## Workflow

### 1. Pick the mode

- If the user only has text, run text-to-image.
- If the user has an existing image and wants a revision, run image edit.
- If the user wants to preserve page structure or only repair one area, use a mask and make the editable region as small as practical.

### 2. Use the project defaults first

In this project, the Azure image config is expected here:

- [/.env](/Users/huanghuan/sanguo-rewrite/.env)

Relevant keys:

- `AZURE_API_KEY`
- optional `AZURE_GPT_IMAGE_ENDPOINT` or `AZURE_OPENAI_IMAGE_ENDPOINT`

The default endpoint is the `gpt-image-2` Azure endpoint documented in:

- [/Users/huanghuan/sanguo-rewrite/DEV.md](/Users/huanghuan/sanguo-rewrite/DEV.md)

The script auto-loads project env files, so in normal use do not ask the user for the API key or endpoint first.

### 3. Use the project script

Use the dedicated Azure image CLI:

- [azure_gpt_image.py](/Users/huanghuan/sanguo-rewrite/tools/azure_gpt_image.py)

Run:

```bash
python3 /Users/huanghuan/sanguo-rewrite/tools/azure_gpt_image.py --help
```

Fastest project-local text-to-image example:

```bash
python3 /Users/huanghuan/sanguo-rewrite/tools/azure_gpt_image.py \
  --output /absolute/path/output.png \
  --metadata \
  "A black and white comic page of three oath-bound brothers riding into chaos"
```

Fastest project-local edit example:

```bash
python3 /Users/huanghuan/sanguo-rewrite/tools/azure_gpt_image.py \
  --image /absolute/path/reference.png \
  --mask /absolute/path/mask.png \
  --prompt-file /absolute/path/edit_prompt.txt \
  --output /absolute/path/edited.png \
  --metadata
```

Only pass `--endpoint` when you intentionally want to override the project's configured Azure deployment.

Text-to-image example:

```bash
python3 /Users/huanghuan/sanguo-rewrite/tools/azure_gpt_image.py \
  --endpoint "https://<resource>.cognitiveservices.azure.com/openai/deployments/<deployment>/images/generations?api-version=2024-02-01" \
  --output /absolute/path/output.png \
  --metadata \
  "A black and white comic page of three oath-bound brothers riding into chaos"
```

Edit example:

```bash
python3 /Users/huanghuan/sanguo-rewrite/tools/azure_gpt_image.py \
  --endpoint "https://<resource>.cognitiveservices.azure.com/openai/deployments/<deployment>/images/generations?api-version=2024-02-01" \
  --image /absolute/path/reference.png \
  --mask /absolute/path/mask.png \
  --prompt-file /absolute/path/edit_prompt.txt \
  --output /absolute/path/edited.png \
  --metadata
```

## Azure-Specific Notes

- For this workflow, Azure edit requests should use Bearer auth with `AZURE_API_KEY`.
- The tool uses Bearer auth exactly as shown in `DEV.md`.
- Default generation parameters match `DEV.md`: `size=1024x1024`, `quality=low`, `output_compression=100`, `output_format=png`, `n=1`.
- When editing, tell the model what must stay unchanged, not only what should change.
- In this repo, the expected endpoint is built into the tool, so do not ask the user to find deployment details unless they want a different deployment.

## Prompting Guidance

- For text-to-image, describe the scene, style, composition, and constraints clearly.
- For edit mode, explicitly say:
  - what should stay the same
  - what region is being fixed
  - what exact defects to repair
- For layout-sensitive comic work, prefer:
  - reference image
  - small mask
  - prompt language like "do not redraw the full page"

## Practical Rules

- Do not redraw a full comic page if the user only wants one panel repaired.
- Keep mask regions as small as possible.
- Preserve existing reading order and layout unless the user explicitly asks for a redesign.
- When helping interactively, tell the user the script can usually run without `--endpoint` or `--api-key` because the project already stores them.
