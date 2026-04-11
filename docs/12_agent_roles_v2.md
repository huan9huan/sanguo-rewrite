# Agent Roles V2

## Goal

V2 不再把 agent 定义成“生成某个文件的人”。

V2 把 agent 定义成两类角色：

1. Production Agents
2. Gatekeepers
3. IT Support / Operations

这样每个 agent 都对一个 contract 或一个 gate 负责，而不是在流程里临时打零工。

## Production Agents

### Chapter Planner

职责：

- 负责 chapter-level planning contract
- 负责 source chapter split
- 只产出 chapter-level planning files
- 不写 prose
- 不写 comic

对应文件：

- `story/chNNN.json`
- `source/chNNN-pNN.md`

对应当前 agent 文件：

- `agents/build-chapter-bundle.md`

### Passage Planner

职责：

- 负责 passage / scene planning contract
- 只产出 passage-level planning files
- 不写 prose
- 不写 comic

对应文件：

- `story/chNNN-pNN/passage.md`
- `story/chNNN-pNN/spec.json`
- `story/chNNN-pNN/sNN-spec.json`

对应当前 agent 文件：

- `agents/build-passage-bundle.md`

### Dramatist

职责：

- 根据 planning contract 写出中文叙事稿
- 负责 scene-to-prose
- 负责 story drive / readability / hook
- 不改 planning contract

对应当前 agent 文件：

- `agents/writer.md`

### Story Reviser

职责：

- 根据 review 修下一版 CN draft
- 优先局部修正，不推翻已成立结构
- 保持 current passage 的 dramatic job 不变

对应当前 agent 文件：

- `agents/editor.md`

### Comic Adapter

职责：

- 把 current readable CN 转成 comic reading contract
- 定义 frame sequence、story function、page semantics
- 产出 comic run 中的 spec / prompt / layout assets
- 不重写 prose

对应当前 agent 文件：

- `agents/build-comic-prompt.md`

### Reading Integrator

职责：

- 把 current text 和 current comic 编排成阅读流
- 决定 frame 插入点
- 保证 comic 服务正文，而不是盖过正文

说明：

- 当前仍保留独立 agent
- 长期看可并入 `Comic Adapter`

对应当前 agent 文件：

- `agents/comic-passage-alignment.md`

### Language Adapter

职责：

- 从 approved CN 派生目标语言阅读版本
- rewrite, not literal translate
- 属于 downstream subsystem，不反向修改主干

对应当前 agent 文件：

- `agents/translator.md`

## Gatekeepers

### Story Reviewer

职责：

- 判断当前 CN draft 是否能通过 text gate
- 评 clarity / story drive / character consistency / translation readiness
- 不直接改稿

对应当前 agent 文件：

- `agents/critic.md`

### Comic QA

职责：

- 判断当前 comic image 能否进入产品链路
- 评 panel usability / story fidelity / character consistency
- 给出 regenerate / revise 的建议
- 不直接重做 comic contract

对应当前 agent 文件：

- `agents/comic_image_evaluator.md`

### Canon Keeper

职责：

- 维护 story canon / character canon / world state canon
- 只记录已经在稳定文本里成立的内容
- 为多语言、图鉴、有声书等派生系统提供长期一致性底座

对应当前 agent 文件：

- `agents/memory_keeper.md`

## IT Support / Operations

### Workspace Operator

职责：

- 维护 draft / comic workspace 到 `current/` 的 promote 流程
- 对 comic run 执行 image normalization、panel detection、layout merge
- 确保 `current/` 只暴露稳定 handoff 文件
- 不重写 prose
- 不改 planning contract
- 不替 Comic QA 做审美判断

对应当前脚本：

- `pipeline/manage_passage_workspace.py`
- `pipeline/update_comic_page.py`

comic promote 必须先完成：

- `comic/runNNN/comic.png`
- `comic/runNNN/comic_panel_boxes.json`
- `comic/runNNN/comic_panel_boxes_debug.png`
- `comic/runNNN/comic.json`

然后才能 promote 到：

- `current/comic.png`
- `current/comic.json`

### Release Operator

职责：

- 从 `current/` 导出 website-ready payload
- 生成 web-friendly image assets
- 确保 exported JSON 与 reading model 同步

对应当前脚本：

- `site/scripts/export-content.mjs`

### Publishing Operator

职责：

- 把选定稳定资产冻结到 `published/`
- 维护 published surface，不从不稳定 draft 或 comic run 直接发布

对应位置：

- `story/<passage>/published/`

## Role Mapping

旧角色到 V2 的映射：

- Planner -> Chapter Planner + Passage Planner
- Writer -> Dramatist
- Critic -> Story Reviewer
- Editor -> Story Reviser
- Build Comic Prompt -> Comic Adapter
- Comic Passage Alignment -> Reading Integrator
- Comic Image Evaluator -> Comic QA
- Memory Keeper -> Canon Keeper
- Translator -> Language Adapter
- Workspace / promote scripts -> Workspace Operator
- Content export script -> Release Operator

## System Rule

Production Agents 负责“做出来”。

Gatekeepers 负责“准不准过”。

同一个 agent 不应同时既是主要产出者，又是最终裁判者，除非只是临时过渡方案。
