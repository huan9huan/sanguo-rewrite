# Passage Comic Pipeline

这条链的目标不是“单张插画”，而是把一个 `passage` 变成一页可切 frame、可配文、可多语言覆盖的连环画页面。

当前仓库里最容易混淆的，是下面两层：

- `comic_panel_boxes_vN.json`
- `comic_reader_layout_vN.json`

这份文档专门把它们的职责和更新逻辑写清楚。

补充说明：

当前推荐的新目录结构见：

- [docs/07_passage-workspace-structure.md](/Users/huanghuan/sanguo-rewrite/docs/07_passage-workspace-structure.md)

对于正在迁移的 passage：

- top level 仍可能保留旧的 `*_vN.*` 文件
- 新流程优先把中间文件写入 `comic/runNNN/`
- 当前被消费的资产放在 `current/`

## 从上到下的资产分层

### 1. Story Assets

来自写作系统：

- `story/<passage>/spec.json`
- `story/<passage>/sNN-spec.json`
- `memory/character_visuals.json`

回答的是：

- 这一段要讲什么
- 哪几个 scene 是核心
- 人物长什么样

漫画改编前必须先做一次核心人物视觉检查：

- 如果当前 passage 有新的核心人物正式出场，先更新 `memory/character_visuals.json`
- 只登记核心 / 反复出现 / 会进入 comic frame 的人物
- 不给路人或一次性群众建立视觉 canon
- 通过后才进入 `passage_comic_spec` 和 page prompt 生成

### 2. Passage Comic Spec

由 planner / comic prompt builder 产出：

- `passage_comic_spec_vN.md`
- `passage_comic_spec_vN.json`

回答的是：

- 这一页该分几格
- 每格的故事功能是什么
- 每格真正该画哪个瞬间
- 每格下面将来要挂哪些文字

这是“语义合同”。
它定义 page 的叙事结构，但还不是最终前端布局。

当前 comic text 的推荐合同是“纯旁白、自包含”：

- frame 下方文字只使用 narrator caption
- 不使用 dialogue-style `speech`
- 不把非主要 / 一次性人物放进旁白 speaker 或主语
- 默认只命名视角锚点或读者必须长期记住的人
- 其余人物用功能称呼或故事结果替代，例如“黄巾先锋”“押车军士”“旧日老师”
- 用旁白讲清 setup、pressure、turn、closure / hook
- comic image + captions 应能独立讲清本 passage 的核心故事

### 3. Base Reader Layout

由 comic spec 派生：

- `comic_reader_layout_vN.json`

它首先回答的是：

- 前端这一页有哪几个 `frame`
- 每个 `frame` 对应什么 `scene_id`
- 每个 `frame` 下方显示什么 `text_block`
- 前端按什么阅读顺序渲染

`text_block` 是 comic 的阅读层，不是正文对白摘录。它应优先服务 comic-only 阅读，并保持 frame ids / scene ids 稳定，方便多语言 overlay 合并。

这一步的 `comic_reader_layout` 可以先没有 `panel_box`。

换句话说：
`comic_reader_layout` 的第一职责是“阅读合同”，不是“检测结果存档”。

### 4. Comic Prompt + Generated Image

从 `passage_comic_spec` 生成：

- `passage_comic_vN_generated/page_prompt.txt`
- `image.png`

这里回答的是：

- 模型怎么画这一页
- 这一页最终成图是什么

### 5. Panel Detection / Annotation

从已生成的 `image.png` 反推或人工标注：

- `comic_panel_boxes_vN.json`
- `comic_panel_boxes_vN_debug.png`

这里回答的是：

- 这张成图里的 panel box 坐标是什么
- 每个 `frame_id` 对应的图像区域在哪里

`comic_panel_boxes` 是“检测 / 标注结果”，不是前端最终合同。

### 6. Final Reader Layout

把 `comic_panel_boxes_vN.json` 合并回新的：

- `comic_reader_layout_vN.json`

这个版本的 `comic_reader_layout` 同时包含：

- frame 顺序
- text block
- image slot
- `panel_box`
- panel detection metadata

站点最终读的是这里的最新版本。

## 两个核心文件的职责

### `comic_panel_boxes_vN.json` 是什么

它是“这一张已存在的 page image 的 panel 区域结果”。

它通常来自两种来源：

- OpenCV 自动检测
- 人工标注 / 人工修正

它应该只关心：

- `frame_id`
- `scene_id`
- `panel_box`
- 必要的 detection metadata

它不应该承担完整的 reader text contract。

### `comic_reader_layout_vN.json` 是什么

它是“前端阅读合同”。

它至少要承载：

- frame 顺序
- frame 的 text block
- image slot
- 可选的 `panel_box`

当 `panel_box` 已经稳定时，前端就按这个文件做切图和排版。

所以真实关系是：

- `comic_panel_boxes` 是局部、图像导向、检测导向
- `comic_reader_layout` 是全局、阅读导向、前端导向

## 当前真实更新逻辑

下面这段是当前代码已经在做的事情。

### Step 0. 先确认角色视觉 canon

在生成 `passage_comic_spec` / prompt 之前：

- 读取当前 passage bundle
- 找出本页 comic frame 需要出现的核心人物
- 确认他们都存在于 `memory/character_visuals.json`
- 如有缺失，先由 `角色定妆` 补齐

### Step 1. 先有 `comic_reader_layout` 初版

先根据 `passage_comic_spec` 生成一个初版：

- `comic_reader_layout_v1.json`

这个版本最重要的是：

- `frames[]`
- `scene_id`
- `text_block`
- 阅读顺序

此时 `panel_box` 可以为空，也可以是临时值。

### Step 2. 生成或人工拿到 `image.png`

使用：

- `passage_comic_vN_generated/page_prompt.txt`

得到：

- `story/<passage>/image.png`

### Step 3. 检测或标注 panel boxes

运行检测脚本：

- [pipeline/detect_comic_panels.py](/Users/huanghuan/sanguo-rewrite/pipeline/detect_comic_panels.py)

它会：

- 读取当前 passage 下最新的 `comic_reader_layout_vN.json`
- 用 layout 里的 `frames[]` 数量作为 `expected_count`
- 读取 `image.png`
- 输出新的 `comic_panel_boxes_vN.json`
- 同时生成 `comic_panel_boxes_vN_debug.png`

重点：

这里的 layout 只被用来提供：

- frame 数量
- frame id / scene id 映射

检测结果本身写在 `comic_panel_boxes_vN.json`，不会原地改 layout。

### Step 4. 把 boxes 合并回新的 reader layout

运行合并脚本：

- [pipeline/merge_comic_panel_boxes.py](/Users/huanghuan/sanguo-rewrite/pipeline/merge_comic_panel_boxes.py)

它会：

- 读取最新的 `comic_panel_boxes_vN.json`
- 读取最新的 `comic_reader_layout_vN.json`
- 把按 `frame_id` 对齐的 `panel_box` 合并进去
- 输出“下一版”的 `comic_reader_layout_vN.json`

也就是说：

- `comic_reader_layout_v2` 不是覆盖 `v1`
- 而是 `v1 + panel boxes merge` 的新版本

### Step 5. Site 只读最新 layout

站点代码会读取当前 passage 目录下最新的：

- `comic_reader_layout_vN.json`

当前实现见：

- [site/lib/content.ts](/Users/huanghuan/sanguo-rewrite/site/lib/content.ts)

所以对站点来说：

- `comic_panel_boxes_vN.json` 不是直接消费资产
- 最新的 `comic_reader_layout_vN.json` 才是最终来源

## 推荐版本规则

这里给一个明确约定，避免后续继续乱。

### 规则 1

`comic_reader_layout` 的版本号，代表“前端阅读合同”的版本。

只要下面任一项变了，就应该出新的 `comic_reader_layout_vN.json`：

- frame 顺序变了
- text block 变了
- image slot 变了
- panel box 变了
- panel detection metadata 变了

### 规则 2

`comic_panel_boxes` 的版本号，代表“针对当前 image 的 panel box 结果版本”。

只要下面任一项变了，就应该出新的 `comic_panel_boxes_vN.json`：

- `image.png` 变了
- box 标注变了
- 检测算法结果变了
- 人工修正了框

### 规则 3

不要直接在旧的 `comic_reader_layout_vN.json` 里手改 `panel_box`。

更稳的做法是：

1. 产出新的 `comic_panel_boxes_vN.json`
2. 再 merge 到新的 `comic_reader_layout_vN.json`

这样版本链才清楚。

### 规则 4

`comic_panel_boxes` 必须依赖一个已有的 `comic_reader_layout` 初版。

因为检测脚本当前需要 layout 来提供：

- `expected_count`
- `frame_id`
- `scene_id`

所以顺序不能倒过来理解成：

- 先完全没有 layout
- 只靠 image 直接得到最终 reader layout

当前不是这条路线。

## 最常见的三种更新场景

### 场景 A：只改文字，不改图片

例如：

- caption 改了
- 多语言文本改了
- frame 标题改了

应该做：

- 新建 `comic_reader_layout_vN.json`

通常不需要新建：

- `comic_panel_boxes_vN.json`

前提是：

- `image.png` 没变
- frame 数量和映射没变
- 现有 `panel_box` 仍然有效

### 场景 B：图片重生了一版，但 frame 语义没变

例如：

- prompt refine 后重新出图
- 同一 page 重新生成了更好的 `image.png`

应该做：

1. 基于已有 reader layout 保留 frame / text 结构
2. 重新产出新的 `comic_panel_boxes_vN.json`
3. merge 到新的 `comic_reader_layout_vN.json`

这是最常见场景。

### 场景 C：comic spec 变了，frame 结构也变了

例如：

- 4 格改成 5 格
- frame 顺序调整
- 某个 moment 被拆分或合并

应该做：

1. 先出新的 `passage_comic_spec_vN.*`
2. 再出新的 base `comic_reader_layout_vN.json`
3. 再生成新的 `image.png`
4. 再出新的 `comic_panel_boxes_vN.json`
5. 最后 merge 成新的 final `comic_reader_layout_vN.json`

这时旧 box 基本不该复用。

## 一个重要判断

`comic_reader_layout` 不是纯“文本布局文件”了。

在当前实现里，它已经是：

- 文本阅读合同
- frame 顺序合同
- image slot 合同
- panel box 合同

而 `comic_panel_boxes` 是它的一个中间输入，不是最终消费层。

所以更准确的理解是：

- `comic_reader_layout` 是 final reader asset
- `comic_panel_boxes` 是 detection artifact

## 推荐生产顺序

当前仓库应按下面顺序理解：

1. PassageSpec 锁定
2. SceneSpec 锁定
3. PassageComicSpec 产出
4. 产出 base `comic_reader_layout_vN.json`
5. 生成 `page_prompt.txt`
6. 生成或人工拿到 `image.png`
7. 检测 / 标注 `comic_panel_boxes_vN.json`
8. merge 到新的 `comic_reader_layout_vN.json`
9. Site 按最新 `comic_reader_layout_vN.json` 渲染

## 对文档里旧说法的替换

如果看到下面这种说法：

- “最后单独输出 `comic_reader_layout_vN.json`”

请替换理解为：

- 先有 base `comic_reader_layout`
- 再有 `comic_panel_boxes`
- 再 merge 成最终 reader layout

也就是说，`comic_reader_layout` 在当前流程里可能出现不止一次。

## 当前相关文件

- [pipeline/update_comic_page.py](/Users/huanghuan/sanguo-rewrite/pipeline/update_comic_page.py)
- [pipeline/detect_comic_panels.py](/Users/huanghuan/sanguo-rewrite/pipeline/detect_comic_panels.py)
- [pipeline/merge_comic_panel_boxes.py](/Users/huanghuan/sanguo-rewrite/pipeline/merge_comic_panel_boxes.py)
- [schemas/comic_reader_layout.schema.json](/Users/huanghuan/sanguo-rewrite/schemas/comic_reader_layout.schema.json)
- [story/cp001-p01/comic_panel_boxes_v3.json](/Users/huanghuan/sanguo-rewrite/story/cp001-p01/comic_panel_boxes_v3.json)
- [story/cp001-p01/comic_reader_layout_v3.json](/Users/huanghuan/sanguo-rewrite/story/cp001-p01/comic_reader_layout_v3.json)

## 推荐命令入口

为了减少手工步骤，当前推荐优先使用统一入口：

- [pipeline/update_comic_page.py](/Users/huanghuan/sanguo-rewrite/pipeline/update_comic_page.py)

它把最常见的三件事收成了三个子命令：

- `prepare-prompt`
- `apply-image`
- `refresh-boxes`

### 1. 为外部模型出图做准备

```bash
python3 pipeline/update_comic_page.py prepare-prompt story/cp001-p01
```

作用：

- 读取 `current/passage_comic_spec.json`，若没有则 fallback 到 legacy spec
- 创建新的 `comic/runNNN/`
- 把 prompt package 写进这个 run
- 同时产出 `frames_summary.json`

适合：

- 你准备把 prompt 拿去 Gemini / Nano Banana / chatbot 手工出图

注意：

- 如果 `passage_comic_spec_vN.json` 不是合法 JSON，这一步会失败
- 先修 spec，再跑 prompt 准备

### 2. 导入新图并自动完成 detect + merge

```bash
python3 pipeline/update_comic_page.py apply-image story/cp001-p01 \
  --from-image /absolute/path/to/new-image.png \
  --run story/cp001-p01/comic/run001
```

作用：

- 把新图复制到目标 `comic/runNNN/image.png`
- 在该 run 内完成 panel detection
- 在该 run 内写入 `comic_panel_boxes.json`
- 在该 run 内 merge 出 `comic_reader_layout.json`

这是最推荐的“regenerate 后接回 run workspace”入口。

如果这次 run 通过评估，再 promote 到 `current/`：

```bash
python3 pipeline/manage_passage_workspace.py promote-comic \
  story/cp001-p01 \
  story/cp001-p01/comic/run001
```

### 3. 只重跑 boxes，不换图

```bash
python3 pipeline/update_comic_page.py refresh-boxes story/cp001-p01 \
  --run story/cp001-p01/comic/run001
```

作用：

- 使用该 run 内已有的 `image.png`
- 重跑 detect
- 在该 run 内重写 boxes 和 merged layout

适合：

- 你刚修了检测逻辑
- 或者想对同一张图重新框一次

## 现在不推荐的手工流程

除非你在 debug 单步脚本，否则不推荐再手工记下面这种链：

1. `detect_comic_panels.py`
2. `merge_comic_panel_boxes.py`
3. 手工归档 `image.png`
4. 手工挑最新版本号

更稳的做法是直接用：

- `apply-image`
- 或 `refresh-boxes`

然后在结果满意时再：

- `promote-comic`

## 一个重要操作规则

无论是 regenerate 还是 refresh，都建议显式传：

- `--run story/<passage>/comic/runNNN`
- 或存在的 `--layout ...`

不要依赖“自动取最新 layout”，因为：

- passage 目录里可能已经有多个 legacy layout
- comic 目录里也可能已经有多个 run
- debug 过程中容易出现版本竞态
- 你真正想作为 base 的 layout 不一定是磁盘上最新那个

当前经验上，显式指定 base layout 会更稳。
