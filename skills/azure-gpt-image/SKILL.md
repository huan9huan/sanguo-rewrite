---
name: azure-gpt-image
description: Use when working inside this project and the user wants to generate an image from text with the project's Azure GPT image workflow, or edit an existing image with a reference image, text instruction, and optional mask. Especially useful for comic iteration, layout-preserving fixes, and prompt-driven image refinement.
---

# Azure GPT Image

## Overview

Use this skill for the project's Azure-hosted GPT image workflows:

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

In this project, the Azure image config is already expected here:

- [site/.env](/Users/huanghuan/sanguo-rewrite/site/.env)

Relevant keys:

- `AZURE_API_KEY`
- `AZURE_OPENAI_IMAGE_ENDPOINT`

The project script now auto-loads:

- [/.env](/Users/huanghuan/sanguo-rewrite/.env)
- [site/.env](/Users/huanghuan/sanguo-rewrite/site/.env)

So in normal use, do not make the user hunt for deployment name or endpoint first. Prefer the project defaults unless they explicitly want another deployment.

### 3. Use the project script

This project already has the image CLI here:

- [openai_text_to_image.py](/Users/huanghuan/sanguo-rewrite/tools/openai_text_to_image.py)

Run:

```bash
python3 /Users/huanghuan/sanguo-rewrite/tools/openai_text_to_image.py --help
```

Fastest project-local text-to-image example:

```bash
python3 /Users/huanghuan/sanguo-rewrite/tools/openai_text_to_image.py \
  --output /absolute/path/output.png \
  --metadata \
  "A black and white comic page of three oath-bound brothers riding into chaos"
```

Fastest project-local edit example:

```bash
python3 /Users/huanghuan/sanguo-rewrite/tools/openai_text_to_image.py \
  --image /absolute/path/reference.png \
  --mask /absolute/path/mask.png \
  --prompt-file /absolute/path/edit_prompt.txt \
  --input-fidelity high \
  --output /absolute/path/edited.png \
  --metadata
```

Only pass `--endpoint` when you intentionally want to override the project's configured Azure deployment.

Text-to-image example:

```bash
python3 /Users/huanghuan/sanguo-rewrite/tools/openai_text_to_image.py \
  --endpoint "https://<resource>.cognitiveservices.azure.com/openai/deployments/<deployment>/images/generations?api-version=2024-02-01" \
  --output /absolute/path/output.png \
  --metadata \
  "A black and white comic page of three oath-bound brothers riding into chaos"
```

Edit example:

```bash
python3 /Users/huanghuan/sanguo-rewrite/tools/openai_text_to_image.py \
  --endpoint "https://<resource>.cognitiveservices.azure.com/openai/deployments/<deployment>/images/generations?api-version=2024-02-01" \
  --image /absolute/path/reference.png \
  --mask /absolute/path/mask.png \
  --prompt-file /absolute/path/edit_prompt.txt \
  --input-fidelity high \
  --output /absolute/path/edited.png \
  --metadata
```

## Azure-Specific Notes

- For this workflow, Azure edit requests should use Bearer auth with `AZURE_API_KEY`.
- Edit mode is more reliable with `api-version=2025-04-01-preview`.
- The project script automatically upgrades Azure edit requests from `2024-02-01` to `2025-04-01-preview`.
- When editing, tell the model what must stay unchanged, not only what should change.
- In this repo, the expected endpoint should already be available through `site/.env`, so do not ask the user to find deployment details unless the configured value is actually missing.

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
