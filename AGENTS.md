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
- Planner: builds chapter / passage / scene specs only
- Writer: writes Chinese draft from specs and memory
- Critic: reviews clarity, story drive, character consistency, translation readiness
- Translator: rewrites approved Chinese into English

## Review Gates
A CN draft should be reviewed for:
- clarity
- story drive
- character consistency
- show-not-tell quality
- translation readiness

## File Ownership
- `story/chapter_specs/`: Planner output
- `story/passage_specs/`: Planner output
- `story/scene_specs/`: Planner output
- `story/drafts_cn/`: Writer output
- `story/drafts_en/`: Translator output
- `story/reviews/`: Critic output
- `memory/`: runtime memory and consistency files

## Safety for Context
Do not feed the whole book into one prompt.
Use only:
- current ChapterSpec
- current PassageSpec
- current SceneSpec(s)
- relevant character memory
- recent passage summary
- style rules
