# Romance Rewrite Workspace

A workspace repo for rewriting *Romance of the Three Kingdoms* into a story-first, foreign-reader-friendly novel centered on Liu Bei, Guan Yu, and Zhang Fei.

## Goal

- Story first, culture implicit
- Chinese source draft first, then English rewrite
- Passage is the main production unit
- Each chapter is split into 5 passages by dramatic unit, not raw length

## Story Layout

Story files are now organized by passage bundle, not by artifact type.

Example:

```text
story/
  chapter_specs/
    cp001.json
  cp001-p01/
    passage.md
    spec.json
    s01-spec.json
    s02-spec.json
    draft_cn_v1.md
    draft_cn_v1_review.json
    cp001_p01_cn_v1.md
  cp001-p02/
    passage.md
    spec.json
```

Rules:

- `*.json` is the agent-facing structured file
- `*.md` is the human-facing readable file
- each passage owns its own spec, scene specs, drafts, reviews, and versioned outputs
- chapter-level planning still lives in `story/chapter_specs/`

## MVP Scope

The first milestone is to finish Chapter 1 with this pipeline:

1. Source chapter text
2. ChapterSpec
3. Passage bundle x 5
4. `spec.json`
5. `sNN-spec.json`
6. `draft_cn_vN.md`
7. `draft_cn_vN_review.json`
8. Optional EN rewrite / approved readable output

## Core Pipeline

```text
source chapter
-> build-chapter-bundle
-> build-passage-bundle
-> generate draft_cn_vN.md
-> review into draft_cn_vN_review.json
-> revise
-> rewrite to EN
-> 更新memory
  → append story events only
  → pipeline/process logs go to transcript.jsonl
  → refresh story_state
  → refresh working_memory
  → optional: refresh story_index
```

## Suggested Start

1. Put the original Chapter 1 text into `source/chapters/cp001.txt`
2. Review `config/project_rules.yaml`
3. Review schemas under `schemas/`
4. Use `story/chapter_specs/cp001.json` as the first planning target
5. Use each `story/cp001-pNN/` folder as the working unit for writing and review
6. Run the MVP tools under `tools/` or wire them into Claude Code / Codex

## Notes

- Never write a passage directly without a PassageSpec
- Never translate before the CN passage draft is approved
- Keep context local to the current passage
- Use working memory, not full-history prompt stuffing
- `memory/story_events.jsonl` only stores story-content events, not pipeline/process events

## Site Analytics

The website supports a small GA4 layer for funnel validation.

- Configure `NEXT_PUBLIC_GA_MEASUREMENT_ID` in the site runtime to enable GA4.
- When the variable is unset, analytics code stays inert and the site should behave normally.
- Current tracked events:
  - `page_view`
  - `landing_view`
  - `landing_cta_click`
  - `start_reading_click`
  - `book_open`
  - `chapter_open`
  - `passage_open`
  - `read_start`
  - `reading_30s`
  - `reading_90s`
  - `passage_scroll_50`
  - `passage_scroll_90`
  - `next_passage_click`
  - `comic_open`
  - `comic_view`
  - `language_switch`
  - `passage_feedback_submit`
  - `follow_subscribe_submit`
  - `future_book_interest_submit`
- Common params include `locale`, `book_id`, `chapter_id`, `passage_id`, `mode`, `trigger`, `target_locale`, and `feedback_kind` where relevant.
- Validate locally with GA4 DebugView after setting the measurement ID and navigating through landing, reader, comic, feedback, and email capture flows.
- See [docs/14_seo_mvp_analytics.md](docs/14_seo_mvp_analytics.md) for the first-20-users funnel review.
- See [docs/15_paid_acquisition_readiness.md](docs/15_paid_acquisition_readiness.md) for the paid acquisition readiness checklist.
