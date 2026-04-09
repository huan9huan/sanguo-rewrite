# Comic Image Evaluation

## Asset

- passage: `cp001-p01`
- run: `comic/run003`
- image: `best-3.jpg`
- baseline_compare: `best-2.jpg`
- original_compare: `image.jpg`
- comic spec: `passage_comic_spec.json`
- prompt lineage: `page_prompt.txt`
- evaluation mode: `product_usability` + `image_only_story_clarity`

## Overall Verdict

`Pass`

`best-3.jpg` 是目前 run003 这条人工编辑支线里最接近可 promote 的版本。

相比 `best-2.jpg`，这次最重要的改进很简单，但很关键：

1. p4 的红色圈记被去掉了
2. 整页重新回到统一的黑白灰系统
3. p4 继续保持了比 `best.jpg` 更克制的榜文表达

它仍然不是完全无瑕疵的最终版，但现在剩下的问题已经从“明显错误”降到了“还能更精致”。如果只从当前样本比较，它已经是目前最好的候选。

## Scores

| 维度 | 分数 | 说明 |
|------|------|------|
| Passage Goal Match | 4/5 | 四格节奏清楚，故事推进稳定 |
| Panel Story Fidelity | 4/5 | p1、p2、p4 稳，p3 仍稍偏字面 |
| Comic Usability | 5/5 | 无底部字幕，reader 形态干净，切 frame 友好 |
| Visual Specificity | 4/5 | 四格锚点都清楚 |
| Style and Character Control | 4/5 | 黑白灰统一，整体风格协调 |
| Text Style and Era Fit | 4/5 | p4 已明显改善，p3 仍略依赖可读字 |
| Image-Only Clarity | 4/5 | 单看图也能较清楚地理解节奏 |
| Refinement Cost | low | 已可作为当前最佳候选，后续只需微调 |

## Panel Notes

### p1 — setup: 温德殿异象

status: `good`

**what landed:**

- 蛇尺寸仍然合适
- 朝堂失措和不祥感仍然成立
- 没有回到 run001 的神怪化

**what is still imperfect:**

- 这一格已基本稳定

### p2 — pressure: 张角聚众

status: `good`

**what landed:**

- 张角、三卷书、信众、`甲子` 锚点都稳定
- 画面清楚，没有走向现代招牌感

**what is still imperfect:**

- 仍然一定程度依赖可读字
- 但当前不是主要阻碍

### p3 — turn: 黄巾起义

status: `good_with_note`

**what landed:**

- 黑白灰纪律成立
- 人潮、火把、夜色、张角站位都在线
- 视觉高潮和压迫感仍然是这一页的强点

**what is still imperfect:**

- 旗号还是偏“把信息写出来”
- 还没有完全达到最理想的“强符号语感”

### p4 — hook: 幽州出榜

status: `good`

**what landed:**

- 这是目前最稳的一版 p4
- 单字 `募` 比 `招兵买马` 更克制，也比 `报告 / 通知` 更对
- 去掉红圈后，榜文重新融回黑白连环画系统
- 城门、行人、榜文位置关系继续成立

**what is still imperfect:**

- 榜文仍然是清晰单字锚点，不是完全自然的模糊古代墨书
- 但相比前几版，这已经是更合理的妥协

## Comparison

### Better than `best-2.jpg`

- 红色圈记消失，风格统一恢复
- p4 不再有明显违和感
- 整页更适合进入 current 候选

### Better than original `image.jpg`

- 底部字幕没有了
- p4 不再是现代公告词
- 页面更符合“图像本体 + 外部文字区”的产品形态

## Root Cause

`mostly_resolved`

这次没有再引入新问题，反而把 `best-2.jpg` 最明显的风格破坏项收掉了。

当前剩余问题主要不是“错”，而是“还能不能更纯”：

- p3 是否继续减少可读字依赖
- p4 是否进一步做成更自然的古代墨书感

## Recommendation

`candidate_for_current`

建议把 `best-3.jpg` 视为当前最强候选。

如果你要进入实际落地流程，我会支持两种选择：

1. 直接把它当当前候选，进入 `current/`
2. 先保留它为 baseline，再做一次非常轻的收尾编辑，只继续处理 p3 旗号字面感

## Summary

`best-3.jpg` 已经把 run003 这条线拉到了一个比较像样的收束点。

它不一定是理论上的终局，但在当前所有样本里，它是最均衡的一版：保留了 run003 的整体画面质量，去掉了底部字幕，修掉了 p4 的现代公告词，也清除了 `best-2.jpg` 的红圈硬伤。现在如果要选一个“先往前走”的版本，我会选它。
