---
name: comic-frame-extractor
description: Use when the user has a comic page image plus a comic spec and wants ordered frame crops exported as separate image files. Best for passage comic pages, OpenCV panel detection, and downstream per-frame review or editing.
---

# Comic Frame Extractor

## Overview

Use this skill to turn one comic page image into ordered frame images.

Inputs:

- one page image
- one `passage_comic_spec.json` or similar comic spec with `panels`

Outputs:

- one cropped image per frame
- one manifest JSON
- optional debug overlay

## Script

Use:

- [export_comic_frames.py](/Users/huanghuan/sanguo-rewrite/skills/comic-frame-extractor/scripts/export_comic_frames.py)

Quick example:

```bash
python3 /Users/huanghuan/sanguo-rewrite/skills/comic-frame-extractor/scripts/export_comic_frames.py \
  --image /absolute/path/page.png \
  --comic-spec /absolute/path/passage_comic_spec.json \
  --output-dir /absolute/path/frames
```

## Guidance

- This skill reuses the existing OpenCV panel detection logic from the project.
- It assumes the comic spec panel order is the desired output order.
- Use the debug overlay when checking tricky layouts.
