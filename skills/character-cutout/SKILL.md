---
name: character-cutout
description: Use when the user wants to extract one character from an image into a reusable character portrait asset using Qwen or Doubao/Seedream, not OpenCV. Best for building a face-focused character library for later compositing, replacement, profile sheets, and consistency workflows.
---

# Character Cutout

## Overview

Use this skill to turn one character from an existing image into a reusable character profile asset.

This skill is model-driven:

- `qwen`
- `seedream`

It does not use OpenCV segmentation.

## What It Produces

The default goal is a face-focused character portrait asset:

- transparent background if the model supports it well
- otherwise pure white clean background
- no surrounding scene clutter
- face and expression preserved from the source image
- head-and-shoulders or bust framing
- minimal clothing detail
- no action pose and no weapon emphasis

This is intended for character libraries, face sheets, later replacement, and compositing workflows.

## Script

Use:

- [cutout_character.py](/Users/huanghuan/sanguo-rewrite/skills/character-cutout/scripts/cutout_character.py)

Qwen example:

```bash
python3 /Users/huanghuan/sanguo-rewrite/skills/character-cutout/scripts/cutout_character.py \
  --engine qwen \
  --image /absolute/path/source.jpg \
  --instruction "Extract Zhang Fei as a head-and-shoulders character portrait asset." \
  --output /absolute/path/character.png \
  --metadata
```

Seedream example:

```bash
python3 /Users/huanghuan/sanguo-rewrite/skills/character-cutout/scripts/cutout_character.py \
  --engine seedream \
  --image /absolute/path/source.jpg \
  --instruction "Extract Zhang Fei as a head-and-shoulders character portrait asset." \
  --output /absolute/path/character.png \
  --metadata
```

## Prompting Guidance

Always tell the model:

- which character to extract
- preserve the exact face, expression, hair, beard, and identity
- remove all other people and scene objects
- keep only the chosen character
- frame as portrait, bust, or big headshot
- avoid action pose emphasis
- do not focus on clothing or props
- output transparent background if possible
- otherwise output pure white background with no shadows

Good instruction pattern:

```text
Extract Zhang Fei as a portrait character asset.
Preserve the exact face, expression, hair, beard, and identity from the source image.
Frame him as a big headshot or bust portrait.
Do not include action pose, weapon emphasis, or full clothing detail.
Remove all other people and background.
Output transparent background if possible; otherwise use pure white background.
Do not redraw as a different person.
```

## Engine Notes

- `qwen` is useful when you want stronger identity preservation through prompt control.
- `seedream` is useful when you want to compare Doubao output against Qwen.
- For difficult comic images, expect to iterate once or twice with a tighter instruction.
- This skill should usually be used for core characters with clear faces, not tiny background figures.
