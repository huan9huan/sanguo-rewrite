# Site Design

## Purpose

This website exists to make the project legible to two audiences at the same time:

- readers who want to experience the rewritten story without reading repo files
- collaborators who want to understand the craft, constraints, and review logic behind each passage

The site should not feel like an admin panel. It should feel like a quiet reading room attached to a working studio.

## Problems To Solve

### 1. Explain the project fast

Visitors should understand within a few seconds that this is:

- a rewrite of *Romance of the Three Kingdoms*
- aimed at general foreign readers
- story-first rather than annotation-first
- built through a staged CN draft -> review -> revision -> EN rewrite process

### 2. Make the current draft readable

The repo structure is production-friendly but not reader-friendly. The site should turn passage bundles into a clean reading experience:

- browse by chapter and passage
- read the latest Chinese draft or approved CN text
- understand the emotional and dramatic role of a passage

### 3. Expose the thinking without overwhelming the reader

The strongest differentiator of this project is not only the text output, but the discipline behind it:

- chapter and passage planning
- scene-level intent
- review gates
- character consistency memory
- translation readiness checks

This thinking should be visible as a second layer, not dumped in the reader's face first.

### 4. Show project momentum

The site should make the pipeline visible:

- what is drafted
- what is reviewed
- what is approved
- what still needs work

This helps the project feel alive and trustworthy.

## Product Positioning

The site uses a dual-layer structure.

- Layer 1: story reading
- Layer 2: creative process and editorial reasoning

The home experience should invite reading first. The craft layer should remain easy to open for visitors who want to go deeper.

This is now expressed as two explicit product modes:

- `Reader Mode`: for visitors who want to read the rewrite with minimal process noise
- `Creator Mode`: for visitors who want to inspect specs, review logic, continuity notes, and production reasoning

## Audience

### Primary

- general readers curious about this rewrite
- friends, early supporters, and potential subscribers

### Secondary

- editors, translators, and writing collaborators
- people interested in AI-assisted literary workflow

## Content Model

The site should be built from the existing repo structure rather than a separate CMS.

### Core inputs

- `story/cpNNN-pNN/passage.md`
- `story/cpNNN-pNN/spec.json`
- `story/cpNNN-pNN/current/draft_cn.md`
- `story/cpNNN-pNN/current/draft_cn_review.json`
- `story/cpNNN-pNN/current/approved_cn.md`
- `story/cpNNN-pNN/current/image.png`
- `story/cpNNN-pNN/current/comic_reader_layout.json`
- `story/cpNNN.json`
- `memory/story_index.json`
- `memory/working_memory.json`
- `source/cpNNN-pNN.md`

During migration, the site may still fall back to legacy top-level versioned files when `current/` is not present.

### Display outputs

- project framing
- chapter overview
- passage cards
- readable passage text
- spec summary
- review findings
- memory snapshot
- source excerpt where useful

## Information Architecture

### Home / Landing

Should answer:

- what this rewrite is
- why it exists
- how the workflow works
- where to start reading
- how to choose between Reader Mode and Creator Mode

### Reader Mode

Should let visitors:

- read chapter passages in sequence
- stay focused on story text and emotional progression
- see only light structural context such as title, status, and passage summary

This mode should feel closest to a manuscript reading room.

### Creator Mode

Should let visitors:

- inspect spec goals, conflict, turn, and ending hook
- review scene planning
- inspect review verdicts and issues
- inspect working memory and active story threads

This mode should feel like a curated studio notebook, not a raw backend dump.

### Passage Browser

Should let visitors:

- scan all available passages
- see title, dramatic role, and current status
- open one passage without losing chapter context

### Passage Detail

Should include:

- latest readable text
- short summary and dramatic question
- story goal, conflict, turn, ending hook
- review verdict and selected issues
- scene plan
- source range

This page is the heart of the experience.

### Process Section

Should show the project method in human language:

- source -> chapter spec -> passage spec -> CN draft -> review -> revision -> EN rewrite
- why this staged pipeline exists
- what each gate protects

### Memory Section

Should explain continuity support:

- active character states
- active threads
- carry-forward notes from working memory

This should feel like a notebook, not a debug dump.

## UX Principles

### Read first, inspect second

The passage text should be the default focal point in Reader Mode. Specs, review notes, and memory should lead in Creator Mode.

### Story language over system language

Use labels like:

- "Why this passage exists"
- "What changed in review"
- "What the writer must carry forward"

Prefer these over internal pipeline labels alone.

### Structured transparency

Do not hide the process. Curate it.

Visitors should come away feeling:

- this project has taste
- this project has discipline
- this project is still in motion

## Visual Direction

The site should follow `DESIGN.md` closely, adapted for a literary project.

### Keep

- parchment background as the primary environment
- serif headlines and editorial pacing
- warm neutrals only
- terracotta for high-signal accents and active states
- alternating light and dark sections to create chapter rhythm
- rounded containers and ring-style depth

### Adapt

- replace product-marketing blocks with reading-room and notebook metaphors
- use quote blocks, manuscript cards, and status chips instead of SaaS dashboards
- treat passage text as the hero artifact

### Avoid

- generic startup gradients
- dashboard tables as the main experience
- over-technical labels on first read
- dense JSON walls without explanation

## MVP Scope

The first site version should do the following well:

1. Introduce the project clearly.
2. Render the currently available passages.
3. Show the latest CN draft for each passage.
4. Surface spec and review context next to the draft.
5. Show high-level memory and pipeline notes.
6. Offer clear entry into Reader Mode and Creator Mode.

The first version does not need:

- authentication
- live editing
- database storage
- a full CMS
- EN rewrite views if they do not exist yet

## Technical Approach

The first implementation should stay simple:

- Next.js App Router app under `site/`
- server-side content loading directly from `story/`, `memory/`, and `source/`
- no changes to the existing story production pipeline

This keeps the site close to source truth, friendly to deployment, and low-maintenance as the writing workflow evolves.

## Success Criteria

The site is successful if a new visitor can:

1. understand the project in under 30 seconds
2. start reading a passage in under 1 minute
3. understand the creative method without opening raw repo files
4. feel that the project is coherent, intentional, and alive
