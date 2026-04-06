# Romance Rewrite Workspace

A workspace repo for rewriting *Romance of the Three Kingdoms* into a story-first, foreign-reader-friendly novel centered on Liu Bei, Guan Yu, and Zhang Fei.

## Goal

- Story first, culture implicit
- Chinese source draft first, then English rewrite
- Passage is the main production unit
- Each chapter is split into 5 passages by dramatic unit, not raw length

## MVP Scope

The first milestone is to finish Chapter 1 with this pipeline:

1. Source chapter text
2. ChapterSpec
3. PassageSpec x 5
4. SceneSpec(s) for each passage
5. DraftCN
6. ReviewReport
7. Revise CN draft
8. Optional EN rewrite

## Core Pipeline

```text
source chapter
-> build chapter spec
-> split into 5 passages
-> build passage spec
-> split each passage into 2-4 scenes
-> build scene specs
-> generate CN draft
-> review
-> revise
-> rewrite to EN
→ append events
→ refresh story_state
→ refresh working_memory
→ optional: refresh story_index
```

## Suggested Start

1. Put the original Chapter 1 text into `source/chapters/ch001.txt`
2. Review `config/project_rules.yaml`
3. Review schemas under `schemas/`
4. Use `story/chapter_specs/ch001.json` as the first planning target
5. Run the MVP tools under `tools/` or wire them into Claude Code / Codex

## Notes

- Never write a passage directly without a PassageSpec
- Never translate before the CN passage draft is approved
- Keep context local to the current passage
- Use working memory, not full-history prompt stuffing
