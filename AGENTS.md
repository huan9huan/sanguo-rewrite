# AGENTS.md

## Project Goal
Rewrite *Romance of the Three Kingdoms* for foreign general readers.

Primary experience:
- enjoyable story
- strong character attachment
- low cultural barrier
- simple Chinese source draft
- English version rewritten from approved Chinese draft

## Story Rules
- Story first, not culture lecture first
- Culture should be implicit unless a tiny clarification is necessary
- Liu Bei / Guan Yu / Zhang Fei are the core viewpoint anchors
- Character consistency matters more than historical over-explanation

## Production Rules
- Never generate a long draft without a PassageSpec
- Never generate a PassageSpec without a ChapterSpec
- Never translate before CN draft is reviewed
- Do not edit published files in place; create a new version or explicit revision

## Writing Style Rules
- Use simple Chinese
- Prefer short sentences
- Show through action and dialogue
- Avoid long exposition
- End passages with a hook or a meaningful emotional closure

## Passage Rules
Each passage should contain:
- one micro-goal
- one tension/conflict
- one turn or advance
- one hook or closure

Each passage usually contains 2-4 scenes.

## Subagents
- Chapter Planner: builds source passage splits and chapter spec
- Passage Planner: builds passage / scene planning files only
- Dramatist: writes Chinese narrative draft from specs and memory
- Story Reviewer: reviews clarity, story drive, character consistency, and translation readiness
- Story Reviser: revises CN draft based on review while preserving valid structure and content
- Comic Adapter: turns current readable text into comic adaptation assets
- Reading Integrator: inserts current comic into the reading flow
- Comic QA: evaluates whether a comic run is good enough for product use
- Canon Keeper: updates story / character / world canon from stable text
- Language Adapter: rewrites approved Chinese into downstream language editions

## Review Gates
A CN draft should be reviewed for:
- clarity
- story drive
- character consistency
- show-not-tell quality
- translation readiness

## File Ownership
- `story/chNNN.json`: Chapter Planner output
- `story/chNNN-pNN/spec.json`: Passage Planner output
- `story/chNNN-pNN/sNN-spec.json`: Passage Planner output
- `story/chNNN-pNN/passage.md`: human-facing passage summary / entry file
- `story/chNNN-pNN/draft/vNNN/draft_cn.md`: Dramatist output
- `story/chNNN-pNN/draft/vNNN/draft_cn_review.json`: Story Reviewer output
- `story/chNNN-pNN/draft/vNNN/approved_cn.md`: approved CN readable output
- `story/chNNN-pNN/comic/runNNN/`: comic prompt, image, boxes, layout, eval for one comic attempt
- `story/chNNN-pNN/current/`: current promoted assets consumed by the site
- `story/chNNN-pNN/published/`: frozen published outputs
- `memory/`: runtime memory and consistency files

## Workspace Structure
- Keep passage-level source-of-truth files at top level: `passage.md`, `spec.json`, `sNN-spec.json`
- Let `draft/` and `comic/` evolve independently
- Keep intermediate files inside `draft/vNNN/` or `comic/runNNN/`
- Promote selected assets into `current/` when they become the active version
- Do not edit `published/` assets in place

## Safety for Context
Do not feed the whole book into one prompt.
Use only:
- current ChapterSpec
- current PassageSpec
- current SceneSpec(s)
- relevant character memory
- recent passage summary
- style rules
