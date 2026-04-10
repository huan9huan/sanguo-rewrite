# Passage Workspace Structure

## Goal

Keep passage-level source files stable at the top level, while letting `draft` and `comic` iterate independently in their own folders.

This avoids top-level version sprawl such as:

- `draft_cn_v2.md`
- `image-v2.png`
- `comic_reader_layout_v7.json`

which are hard to pair back together.

## Top-Level Principle

At `story/<passage>/`, keep only passage-wide source-of-truth files at the top level:

- `passage.md`
- `spec.json`
- `sNN-spec.json`

Everything else should gradually move toward one of these folders:

- `draft/`
- `comic/`
- `current/`
- `published/`

## Recommended Layout

```text
story/cp001-p01/
  passage.md
  spec.json
  s01-spec.json
  s02-spec.json
  s03-spec.json

  draft/
    v001/
      draft_cn.md
      draft_cn_review.json
      approved_cn.md
      meta.json
    v002/
      ...

  comic/
    run001/
      meta.json
      passage_comic_spec.json
      passage_comic_spec.md
      base_comic_reader_layout.json
      page_prompt.txt
      frames_summary.json
      image.png
      comic_panel_boxes.json
      comic_panel_boxes_debug.png
      comic_reader_layout.json
      eval.md
    run002/
      ...

  current/
    draft_cn.md
    draft_cn_review.json
    approved_cn.md
    comic.png
    comic.json

  published/
    cn/
    en/
    comic/
```

## How To Think About Versions

### Draft Versions

`draft/vNNN/` is one text revision package.

It contains:

- the draft text
- the review for that draft
- optional approved CN text

Draft versions should move forward when the text changes meaningfully.

### Comic Runs

`comic/runNNN/` is one comic attempt package.

It contains:

- the comic spec used for that attempt
- the prompt package
- the generated image
- the panel boxes
- the merged reader layout
- optional evaluation

Comic runs should move forward when the image attempt changes.

This means:

- text revision count does not have to match comic run count
- comic can iterate multiple times against the same approved or draft text

## Role Of `current/`

`current/` is the active promoted state for the passage.

The site should prefer reading from `current/`.

`current/` is not the full history.
It is the handoff surface for the rest of the system.

Typical promoted assets:

- current draft text
- current approved CN text
- current comic image
- current comic reader layout

## Role Of `published/`

`published/` is for frozen outputs.

Rules:

- do not edit in place
- publish by copying from `current/` or from a selected draft/comic workspace
- treat published output as stable external output

## Recommended Iteration Flow

### Draft Flow

1. Create or revise a new `draft/vNNN/`
2. Review it
3. If selected, promote files into `current/`
4. If finalized, publish from `current/`

### Comic Flow

1. Create a new `comic/runNNN/`
2. Generate or refine prompt inside that run
3. Add the resulting image into that run
4. Detect boxes and merge layout inside that run
5. Evaluate that run
6. If selected, promote files into `current/`
7. If finalized, publish from `current/`

## Command Entry Points

### Bootstrap legacy files into the new structure

```bash
python3 pipeline/manage_passage_workspace.py bootstrap-legacy story/cp001-p01
```

This does not delete old top-level files.
It snapshots the latest legacy assets into:

- `draft/v001/`
- `comic/run001/`
- `current/`

### Prepare a new comic run

```bash
python3 pipeline/update_comic_page.py prepare-prompt story/cp001-p01
```

This creates the next `comic/runNNN/` and writes prompt assets there.

### Apply a new image to a comic run

```bash
python3 pipeline/update_comic_page.py apply-image story/cp001-p01 \
  --from-image /absolute/path/to/new-image.png
```

This writes the image, boxes, and merged layout into the target run.

### Promote a comic run to current

```bash
python3 pipeline/manage_passage_workspace.py promote-comic \
  story/cp001-p01 \
  story/cp001-p01/comic/run001
```

### Promote a draft version to current

```bash
python3 pipeline/manage_passage_workspace.py promote-draft \
  story/cp001-p01 \
  story/cp001-p01/draft/v001
```

## Migration Strategy

Do not try to clean the entire repo in one shot.

Recommended approach:

1. New passages use the new structure first
2. Existing passages get bootstrapped when touched
3. The site prefers `current/`, but still falls back to legacy top-level files
4. Legacy versioned files remain for now as migration history

This keeps the workflow clean without forcing a risky big-bang move.
