---
name: qwen-image-retouch
description: Use when the user wants to retouch or revise an existing image with a text instruction using the project's Qwen image editing workflow. Best for prompt-driven image fixes, layout-preserving edits, and masked revisions on one or more reference images.
---

# Qwen Image Retouch

## Overview

Use this skill to edit an existing image with Qwen image editing.

Best fits:

- fix part of an image with a prompt
- preserve the overall layout while changing local details
- use a mask to restrict edits to one panel or one region

## Project Defaults

This project already keeps Qwen config in:

- [/Users/huanghuan/sanguo-rewrite/.env](/Users/huanghuan/sanguo-rewrite/.env)

The script auto-loads project env files, so prefer project defaults before asking the user for API details.

## Script

Use:

- [qwen_image_edit.py](/Users/huanghuan/sanguo-rewrite/skills/qwen-image-retouch/scripts/qwen_image_edit.py)

Quick example:

```bash
python3 /Users/huanghuan/sanguo-rewrite/skills/qwen-image-retouch/scripts/qwen_image_edit.py \
  --image /absolute/path/reference.png \
  --mask /absolute/path/mask.png \
  --prompt-file /absolute/path/edit_prompt.txt \
  --output /absolute/path/edited.png \
  --metadata
```

## Guidance

- Use a mask whenever the user wants to preserve most of the original image.
- Keep the editable region as small as practical.
- In the prompt, explicitly say what must stay unchanged.
- If the edit should preserve a comic page layout, say so directly.
