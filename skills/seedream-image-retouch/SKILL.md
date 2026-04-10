---
name: seedream-image-retouch
description: Use when the user wants to retouch or revise an existing image with Doubao Seedream or SeedEdit inside this project. Best for prompt-driven image editing, reference-image generation, and layout-preserving revisions using the project's Volcengine Ark setup.
---

# Seedream Image Retouch

## Overview

Use this skill to edit an existing image with Doubao Seedream / SeedEdit.

Best fits:

- fix part of an image with a prompt
- preserve an existing composition while revising subject details
- compare Volcengine editing quality against Qwen or Azure GPT Image

## Project Defaults

This project already keeps Volcengine Ark config in:

- [/Users/huanghuan/sanguo-rewrite/.env](/Users/huanghuan/sanguo-rewrite/.env)

Relevant keys:

- `ARK_API_KEY`
- `ARK_BASE_URL`
- `ARK_IMAGE_EDIT_MODEL` or `ARK_IMAGE_MODEL`

The script auto-loads project env files, so prefer project defaults before asking the user for API details.

## Script

Use:

- [seedream_image_edit.py](/Users/huanghuan/sanguo-rewrite/skills/seedream-image-retouch/scripts/seedream_image_edit.py)

Quick example:

```bash
python3 /Users/huanghuan/sanguo-rewrite/skills/seedream-image-retouch/scripts/seedream_image_edit.py \
  --image /absolute/path/reference.jpg \
  --prompt-file /absolute/path/edit_prompt.txt \
  --output /absolute/path/edited.png \
  --metadata
```

## Guidance

- This flow uses Seedream/SeedEdit style image editing by sending reference image(s) plus a prompt.
- Keep the prompt explicit about what must stay unchanged.
- If the user wants very local changes, say so clearly in the prompt because this API does not use a local mask in the same way as the Azure edit flow.
- For comparison tests, keep the same source image and prompt across Qwen, Seedream, and Azure.
