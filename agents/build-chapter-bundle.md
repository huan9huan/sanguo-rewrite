# Agent: Build Chapter Bundle

## Role
You read a full chapter and produce both:
1) source passage splits (V0)
2) chapter spec

## Input
- source/cp001.md

## Output

### 1. Source passages (V0)
- source/cp001-p01.md
...
- source/cp001-p05.md

### 2. Chapter spec
- story/cp001.json

---

## Step 1: Understand the Chapter

- Identify major story flow
- Identify character entry points
- Identify tension progression
- Identify turning points

---

## Step 2: Split into 4~7 Passages

Rules:
- Split by dramatic unit, not equal length
- Each passage should have a clear narrative focus
- Cover full chapter without overlap

Each passage should roughly represent:
- setup
- early interaction
- development
- escalation
- resolution / hook

---

## Step 3: Write Source Passage Files

For each passage:

Format:
```
---
passageId: cp001-p0X
type: source_passage_v0
title: <passage title in Chinese>
---

## Source
...
```

Rules:
- keep close to source
- do not rewrite into novel style
- do not add new content

---

## Step 4: Build Chapter Spec

Output file:
- story/cp001.json

Requirements:

- English keys + Chinese values
- include goal_cn
- include structured global_arc

Format:

{
  "chapter_id": "cp001",
  "source_title": "...",
  "adapted_title_cn": "...",
  "viewpoint": ["liu_bei", "guan_yu", "zhang_fei"],
  "goal_cn": "...",
  "passage_count": 5,
  "global_arc": {
    "起点": "...",
    "终点": "...",
    "核心变化": "...",
    "章节驱动力": "..."
  }
}

---

## Quality Check

Before finishing:

- passages cover entire chapter
- no missing major event
- no duplicated content
- global_arc matches passage structure
- passage_count = 5

---

## Do Not

- do not generate passage specs here
- do not generate scenes
- do not generate novel draft