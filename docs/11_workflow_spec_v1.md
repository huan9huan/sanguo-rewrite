# Workflow Spec V1

## Goal

本项目的生产流程固定为四条主线：

1. Planning
2. Draft
3. Comic
4. Reading Integration

目标不是做一个“万能 content builder”，而是把每一阶段的输入、输出、责任和 handoff 明确下来。

## Core Principles

- story first
- spec first
- current is the website handoff surface
- 每个 agent 只做一层工作
- 网站只消费当前态，不消费创作历史

## Source Of Truth

### Stable planning files

这些文件是 passage 的稳定规划层：

- `story/chNNN.json`
- `story/chNNN-pNN/passage.md`
- `story/chNNN-pNN/spec.json`
- `story/chNNN-pNN/sNN-spec.json`

规则：

- Chapter Planner / Passage Planner 以外的 agent 都不能直接改这些文件
- 如果规划有问题，应回到 Planning 阶段显式修订

## Agent Roles V2

当前 workflow 按两类 agent 运行：

1. Production Agents
2. Gatekeepers

Production Agents:

- Chapter Planner
- Passage Planner
- Dramatist
- Story Reviser
- Comic Adapter
- Reading Integrator
- Language Adapter

Gatekeepers:

- Story Reviewer
- Comic QA
- Canon Keeper

角色映射见：

- `docs/12_agent_roles_v2.md`

### Current handoff files

这些文件是网站和后续流程消费的当前态：

- `story/chNNN-pNN/current/draft_cn.md`
- `story/chNNN-pNN/current/draft_cn_review.json`
- `story/chNNN-pNN/current/approved_cn.md`
- `story/chNNN-pNN/current/comic.png`
- `story/chNNN-pNN/current/comic.json`
- `story/chNNN-pNN/current/comic_alignment.json`

规则：

- 网站只认 `current/`
- 历史版本保留在 `draft/vNNN/` 和 `comic/runNNN/`
- legacy top-level 文件只允许在迁移期内部 fallback，不是业务入口

## Pipeline 1: Planning

### Purpose

把 chapter source 拆成可写、可审、可画的故事单元。

### Step 1. Chapter Planning

输入：

- `source/chNNN.md`

输出：

- `source/chNNN-pNN.md`
- `story/chNNN.json`

责任：

- 按戏剧单元拆分 chapter
- 定义 chapter arc
- 定义 chapter 的 passage count

对应 agent：

- `agents/build-chapter-bundle.md`

### Step 2. Passage Planning

输入：

- `source/chNNN-pNN.md`
- `story/chNNN.json`

输出：

- `story/chNNN-pNN/passage.md`
- `story/chNNN-pNN/spec.json`
- `story/chNNN-pNN/sNN-spec.json`

责任：

- 定义 passage micro-goal
- 定义 conflict / turn / ending hook
- 把 passage 拆成 2-4 个 scene
- 让 scene 成为唯一内部写作单元

对应 agent：

- `agents/build-passage-bundle.md`

### Planning Gate

通过条件：

- passage 目标明确
- scene 划分完整且不重叠
- story-first，不是文化讲解 first
- 所有 scene 都可直接写

下一步：

- 进入 Draft Pipeline

## Pipeline 2: Draft

### Purpose

根据 planning contract 产出可读性强的中文故事，并通过 review gate。

### Step 1. Write Draft

输入：

- `story/chNNN.json`
- `story/chNNN-pNN/passage.md`
- `story/chNNN-pNN/spec.json`
- `story/chNNN-pNN/sNN-spec.json`
- relevant `memory/*`

输出：

- `story/chNNN-pNN/draft/vNNN/draft_cn.md`

责任：

- 按 scene 写正文
- 简单中文
- 现代故事写法
- 强调动作、对话、推进

对应 agent：

- `agents/writer.md` (`Dramatist`)

### Step 2. Review Draft

输入：

- 当前 `draft_cn.md`
- planning files
- relevant memory

输出：

- `story/chNNN-pNN/draft/vNNN/draft_cn_review.json`

责任：

- 判断 clarity
- 判断 story drive
- 判断 character consistency
- 判断 show-not-tell
- 判断 translation readiness

对应 agent：

- `agents/critic.md` (`Story Reviewer`)

### Step 3. Revise Draft

输入：

- 当前 `draft_cn.md`
- 当前 `draft_cn_review.json`
- planning files
- relevant memory

输出：

- `story/chNNN-pNN/draft/vNNN+1/draft_cn.md`

责任：

- 解决 review 的关键问题
- 保持 story structure 不变
- 不重做 planning

对应 agent：

- `agents/editor.md` (`Story Reviser`)

### Step 4. Promote Current Text

当某一版 draft 达到当前可消费质量时，promote 到：

- `current/draft_cn.md`
- `current/draft_cn_review.json`
- `current/approved_cn.md` if approved

责任：

- 给 comic 和 website 提供稳定文本入口

对应脚本：

- `pipeline/manage_passage_workspace.py`

### Draft Gate

通过条件：

- 当前文字可独立阅读
- scene 职责都完成
- 角色不跑偏
- 结尾有推进或收束

下一步：

- 可进入 Comic Pipeline
- 可进入 Reading Integration

## Pipeline 3: Comic

### Purpose

把 passage 的故事结构转成一页可阅读的小人书页面。

### Step 1. Check Character Visual Canon

输入：

- `story/chNNN-pNN/passage.md`
- `story/chNNN-pNN/spec.json`
- `story/chNNN-pNN/sNN-spec.json`
- current readable CN text
- `memory/character_memory.json`
- `memory/character_visuals.json`

输出：

- updated `memory/character_visuals.json` if a new core character needs visual canon

责任：

- 判断当前 passage 是否有新的核心人物正式出场
- 只为核心 / 反复出现 / 会进入 comic frame 的人物补视觉锚点
- 不为路人和一次性群众建立视觉 canon
- 保证 Comic Adapter 不需要临时发明人物外貌

通过条件：

- 当前 comic frames 需要出现的核心人物都已存在于 `memory/character_visuals.json`
- 新增人物视觉条目短、稳、可直接进入 prompt
- 没有覆盖已有核心人物的稳定视觉身份

对应 agent：

- `agents/character-visual-keeper.md` (`Character Visual Keeper`)

### Step 2. Build Comic Semantics

输入：

- `story/chNNN-pNN/spec.json`
- `story/chNNN-pNN/sNN-spec.json`
- `story/chNNN-pNN/passage.md`
- current readable CN text
- `memory/character_visuals.json`

输出：

- `comic/runNNN/passage_comic_spec.json`
- `comic/runNNN/passage_comic_spec.md`
- `comic/runNNN/base_comic_reader_layout.json`
- `comic/runNNN/page_prompt.txt`
- `comic/runNNN/frames_summary.json`

责任：

- 选择 frame 数量
- 定义每个 frame 的故事功能
- 保证人物特征一致
- 保证 page mobile-first 可读
- 让 prompt 服务故事清晰度

对应 agent / 脚本：

- `agents/build-comic-prompt.md` (`Comic Adapter`)
- `pipeline/story_adapter.py`
- `pipeline/generate_comic_prompt.py`
- `pipeline/update_comic_page.py`

### Step 3. Manual Text-to-Image

输入：

- `comic/runNNN/page_prompt.txt`

输出：

- `comic/runNNN/image.png|jpg|jpeg|webp`

责任：

- 这是手工图像生成步骤
- 不是当前自动化范围

### Step 4. Detect And Merge Layout

输入：

- `comic/runNNN/image.*`
- `comic/runNNN/base_comic_reader_layout.json`

输出：

- `comic/runNNN/comic_panel_boxes.json`
- `comic/runNNN/comic_panel_boxes_debug.png`
- `comic/runNNN/comic_reader_layout.json`

责任：

- 检测 panel boxes
- 合并得到最终 reader layout

对应脚本：

- `pipeline/detect_comic_panels.py`
- `pipeline/merge_comic_panel_boxes.py`
- `pipeline/update_comic_page.py`

### Step 5. Evaluate And Promote

输入：

- 当前 comic run 资产

输出：

- `comic/runNNN/eval.md`
- promote 到 `current/`

责任：

- 评估当前漫画页是否可用
- 把选中的 comic 结果提升到网站消费层
- comic promote 只写两个 handoff 文件：
  `current/comic.png` 和 `current/comic.json`

对应脚本：

- `pipeline/manage_passage_workspace.py`

### Comic Gate

通过条件：

- frame 顺序清晰
- 不剧透
- 人物一致
- panel 切分稳定
- reader layout 可直接消费

下一步：

- 进入 Reading Integration

## Pipeline 4: Reading Integration

### Purpose

把当前文字和当前漫画编排成最终阅读体验。

### Step 1. Build Passage Alignment

输入：

- current readable CN text
- current `comic_reader_layout.json`
- current `passage_comic_spec.json`
- planning files

输出：

- `current/comic_alignment.json`

责任：

- 决定每个 frame 插在哪个 paragraph 后
- 保证 comic 服务正文
- 避免提前剧透

对应 agent：

- `agents/comic-passage-alignment.md` (`Reading Integrator`)

### Step 2. Build Website Reading Model

输入：

- `current/` assets
- planning files
- chapter / memory files

输出：

- website `Passage` data model
- optional exported JSON snapshot

责任：

- 组装 reader 页面需要的数据
- 组装 chapter / book 浏览信息
- 不重新解释创作历史

当前代码位置：

- `site/lib/repo-content.ts`
- `site/lib/content.ts`
- `site/scripts/export-content.mjs`

### Reading Gate

通过条件：

- 读者只看网站就能顺畅读完
- comic 插入点自然
- 页面不需要理解内部流程才能使用

## Passage State Model

每个 passage 只需要关注当前阶段状态，不需要把全部版本历史暴露给网站。

建议统一为：

```ts
type PassageWorkflowState =
  | "planned"
  | "drafting"
  | "reviewing"
  | "approved_text"
  | "comic_in_progress"
  | "ready_to_read";
```

最小派生字段：

```ts
type PassageCurrentState = {
  workflow_state: PassageWorkflowState;
  has_draft: boolean;
  has_review: boolean;
  has_approved_cn: boolean;
  has_comic_image: boolean;
  has_comic_json: boolean;
  has_alignment: boolean;
  reader_text_source: "approved_cn" | "draft_cn" | "none";
};
```

## What Each Layer Must Not Do

### Planning must not

- 写正文
- 评审正文
- 生成漫画 prompt

### Draft must not

- 改 planning contract
- 重做 chapter split
- 提前消费下一 passage

### Comic must not

- 重写正文
- 改 scene structure
- 把 image detection 逻辑混进 website

### Website must not

- 猜最新版本
- 直接消费历史版本目录
- 承担 creator/studio dashboard 职责

## Product Rule

网站产品只保留 Reader experience。

因此：

- 删除 `creator` 模式
- 不再维护 Creator Mode 页面
- 流程信息只以轻量状态形式出现在阅读产品中

## Naming Rule

以后不要再用一个大而空的 `content builder` 来指代全流程。

统一使用：

- Planning Pipeline
- Draft Pipeline
- Comic Pipeline
- Reading Integration
- Export Snapshot

## Implementation Priority

### V1 first

1. 删除 creator route
2. 把网站定位为 reader-first
3. 把 `current/` 固定为网站业务入口
4. 抽统一 reading model builder
5. 把 export 降级为 deploy snapshot

### Later

1. passage 状态机
2. workflow orchestration
3. 多语言层
4. publish layer
