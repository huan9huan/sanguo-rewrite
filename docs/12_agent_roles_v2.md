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
- 负责 website list 入口文案：最短 `short_title` 和单行 `catchup`
- 只产出 passage-level planning files
- 不写 prose
- 不写 comic

对应文件：

- `story/chNNN-pNN/passage.md`
- `story/chNNN-pNN/passage.md` frontmatter `short_title` / `catchup`
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
- 只使用 `memory/character_visuals.json` 中已登记的核心人物视觉锚点
- 不重写 prose

前置条件：

- 如果当前 passage 有新的核心人物正式出场，必须先由 Character Visual Keeper 更新 `memory/character_visuals.json`
- 如果核心人物缺少视觉 canon，Comic Adapter 应停止并交回 `角色定妆`

对应当前 agent 文件：

- `agents/build-comic-prompt.md`

### Character Visual Keeper

职责：

- 在漫画改编前检查 passage 是否有新的核心人物正式出场
- 为核心 / 反复出现 / 会进入 comic frame 的人物建立视觉锚点
- 维护 `memory/character_visuals.json`
- 不写 prose
- 不生成 comic prompt
- 不给路人角色建过度设定

对应文件：

- `memory/character_visuals.json`

对应当前 agent 文件：

- `agents/character-visual-keeper.md`

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

如果输入图是 JPG/JPEG/WebP：

- 先用 ImageMagick 转成 web-friendly PNG
- 最终 handoff 文件仍然固定为 `comic.png`
- 不把 JPG/JPEG/WebP 原样 promote 到 `current/`

然后才能 promote 到：

- `current/comic.png`
- `current/comic.json`

### Release Operator

职责：

- 从 `current/` 导出 website-ready payload
- 生成 web-friendly image assets
- 确保 exported JSON 与 reading model 同步
- 本地验证 content export 和 website build
- 本地确认没问题后，把 `site/public/content/` 同步到远程 GCS
- GCS content sync 完成后，触发网站部署

对应当前脚本：

- `site/scripts/export-content.mjs`
- `site/package.json` scripts: `content:export`, `build`, `deploy`

典型命令：

- `cd site && npm run content:export`
- `cd site && npm run build`
- `gsutil -m rsync -r -d site/public/content gs://zh-books/sanguo`
- `cd site && npm run deploy`

规则：

- 不要跳过本地 build 直接同步远程
- GCS 同步的是 exported content snapshot，不是 `story/` 源工作区
- 部署前确认远程 content bucket 已经拿到最新 `manifest.json`

## Role Mapping

旧角色到 V2 的映射：

- Planner -> Chapter Planner + Passage Planner
- Writer -> Dramatist
- Critic -> Story Reviewer
- Editor -> Story Reviser
- Build Comic Prompt -> Comic Adapter
- Comic Passage Alignment -> Reading Integrator
- Comic Image Evaluator -> Comic QA
- Character visual check -> Character Visual Keeper
- Memory Keeper -> Canon Keeper
- Translator -> Language Adapter
- Workspace / promote scripts -> Workspace Operator
- Content export script -> Release Operator

## System Rule

Production Agents 负责“做出来”。

Gatekeepers 负责“准不准过”。

同一个 agent 不应同时既是主要产出者，又是最终裁判者，除非只是临时过渡方案。
