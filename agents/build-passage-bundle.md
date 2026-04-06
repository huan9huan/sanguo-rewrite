# Agent: Build Passage Bundle

## Role
You read one chapter spec plus one source passage and produce the full passage bundle skeleton for planning.

You generate:
1. passage-level readable file
2. passage spec
3. scene specs

This agent is for planning only.

## Input
- source/cp001-p01.md
- story/cp001.json

## Output

For one passage bundle:

- story/cp001-p01/passage.md
- story/cp001-p01/spec.json
- story/cp001-p01/s01-spec.json
- story/cp001-p01/s02-spec.json
- story/cp001-p01/s03-spec.json (if needed)
- story/cp001-p01/s04-spec.json (if needed)

---

## Step 1: Understand the Passage

- Read the source passage
- Read the chapter spec
- Identify the micro-goal of this passage
- Identify the main tension
- Identify the turn or advance
- Identify the ending hook or closure

You should answer:
- why this passage exists
- what changes by the end
- what must be saved for the next passage

---

## Step 2: Define Passage-Level Structure

Split the passage into 2~4 scenes.

Rules:
- split by dramatic function, not paragraph count
- each scene should have one clear job
- scenes should connect naturally
- no overlap between scenes
- together they should fully cover this passage

Typical scene jobs:
- setup
- pressure
- reveal
- choice
- bond
- reversal
- hook

Do not create a separate beat layer.
Scene is the only internal planning unit under passage.

---

## Step 3: Write `passage.md`

Output file:
- story/cp001-p01/passage.md

Purpose:
- human-readable entry file
- quick overview for writer / critic / human review

Format:

```md
---
id: cp001-p01
chapter_id: cp001
passage_id: p01
title: <passage title in Chinese>
status: spec_draft
source_file: ../../source/cp001-p01.md
spec_file: spec.json
scene_spec_files:
  - s01-spec.json
  - s02-spec.json
draft_files:
  - draft_cn_v1.md
review_files:
  - draft_cn_v1_review.json
approved_cn_files:
  - cp001_p01_cn_v1.md
---

# <title>

## Summary

- 目标：...
- 冲突：...
- 转折：...
- 收束：...

## Scene Plan

1. `s01-spec.json` ...
2. `s02-spec.json` ...

## Source

`从"..."到"..."`
```

Rules:
- short and readable
- for humans, not schema completeness
- should help someone understand the passage in 20 seconds
- `Source` 这里默认只写来源范围说明，不复制整段原文
- 原文应通过 `source_file` 指向 `source/cp001-p01.md`

---

## Step 4: Build `spec.json`

Output file:
- story/cp001-p01/spec.json

Requirements:
- English keys + Chinese values where appropriate
- no `beats`
- scene list is referenced only by `scene_ids`
- keep this file at passage level only

Format:

```json
{
  "chapter_id": "cp001",
  "passage_id": "p01",
  "title_cn": "...",
  "goal_cn": "...",
  "dramatic_question_cn": "...",
  "viewpoint_focus": ["liu_bei"],
  "emotion_curve": ["...", "...", "..."],
  "hook_cn": "...",
  "conflict_cn": "...",
  "turn_cn": "...",
  "ending_hook_cn": "...",
  "source_text_range": "从'...'到'...'",
  "scene_ids": ["cp001_p01_s1", "cp001_p01_s2"],
  "must_include": ["...", "..."],
  "must_avoid": ["...", "..."],
  "status": "draft"
}
```

Passage spec should answer:
- what this passage must accomplish
- what emotional shape it should have
- what must appear
- what must not appear

It should not micromanage line-by-line writing.

---

## Step 5: Build Scene Specs

Output files:
- story/cp001-p01/s01-spec.json
- story/cp001-p01/s02-spec.json
- ...

Each scene spec should carry the actual internal planning load.

Format:

```json
{
  "scene_id": "cp001_p01_s1",
  "chapter_id": "cp001",
  "passage_id": "p01",
  "scene_type": "intro_scene",
  "purpose_cn": "...",
  "setting_cn": "...",
  "characters": ["liu_bei"],
  "scene_goal_cn": "...",
  "tension_level": 0.4,
  "must_include": ["...", "..."],
  "must_avoid": ["...", "..."],
  "status": "draft"
}
```

Rules:
- each scene must have one clear purpose
- `scene_goal_cn` should be concrete and writable
- include only characters actually active in the scene
- tension should move, not stay flat across all scenes

---

## Step 6: Cross-Check the Bundle

Before finishing:

- `passage.md` matches `spec.json`
- `spec.json` and `scene_ids` match the actual scene spec files
- scenes cover the full passage
- no duplicated scene purpose
- no missing turn
- ending hook is preserved
- file names are consistent

---

## Quality Check

Ask:

- Is the passage goal clear?
- Is the tension specific?
- Is the turn real, not vague?
- Does each scene do different work?
- Can the writer write from these files without inventing structure?
- Can the critic review from these files without guessing intent?

---

## Do Not

- do not write draft_cn here
- do not write review here
- do not translate here
- do not create a beat layer
- do not dump full chapter context into one passage
- do not mix writer output into spec files
