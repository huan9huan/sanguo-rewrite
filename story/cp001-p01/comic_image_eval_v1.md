# Comic Image Evaluation v1

## Asset

- passage: `cp001-p01`
- run: `comic/run006`
- image: `comic.png`
- comic spec: `comic/run006/passage_comic_spec.json`
- prompt: `comic/run006/page_prompt.txt`
- evaluation mode: `product_usability` + `image_only_story_clarity` + `caption_self_containment`

## Overall Verdict

`Pass with Important Notes`

run006 已经可以作为当前 passage 的可用候选继续留在链路里。

它最重要的价值不是“每一格都完全命中”，而是三件事同时站住了：

1. 整体版式确实是 `top-wide / middle-two / bottom-wide`，没有退化成四宫格
2. 全页彻底无图内说明条和大段字幕，适合后续前端单独渲染文字
3. 黑白小人书质感、乱世群像、第三格起事高潮，都已经比旧版更稳定

但它还不适合直接 promote 到 `current/`，因为仍有几个会影响产品质量的硬伤：

1. 第二格把“三卷天书”画成了四卷，直接偏离当前 comic spec
2. 第二格张角的个体肖像感偏强，压过了“村口聚众成势”的群像目标
3. 第四格榜文虽然位置对了，但文书感偏空，古代招兵榜锚点还不够扎实

所以结论是：这版能留、值得作为新 baseline，但还不是最终 production candidate。

## Scores

| 维度 | 分数 | 说明 |
|------|------|------|
| Passage Goal Match | 4/5 | 乱世起势、黄巾爆发、幽州招兵钩子都成立 |
| Panel Story Fidelity | 3/5 | p1、p3、p4 基本对齐，p2 的“三卷”出现明确偏差 |
| Comic Usability | 4/5 | 版式清楚、无图内字、利于后续切 frame 和叠加多语言文字 |
| Visual Specificity | 4/5 | 蛇、甲子牌匾、黄巾洪流、榜文四个锚点都可辨认 |
| Style and Character Control | 4/5 | 黑白连环画方向稳定，但 p2 稍有“人物海报化”倾向 |
| Text Style and Era Fit | 4/5 | 没有现代公告字样，是明显进步；但 p4 文书气不够足 |
| Image-Only Clarity | 4/5 | 单看图能大致读出王朝不祥、张角起事、天下大乱、幽州出榜 |
| Caption Self-Containment | 4/5 | 配合 frame 下方文字后，应能稳定成立为独立一页小连环画 |
| Refinement Cost | medium | 不用推翻重来，但需要针对 p2 和 p4 做定点修正 |

## Panel Notes

### p1 — setup: 温德殿异象

status: `good`

what landed:

- 顶部宽景成立，龙椅、空座、群臣惊散的关系清楚
- 蛇足够大，也足够清楚，不会被看成装饰纹样
- 氛围是“王朝将倾”，不是恐怖片或奇幻戏

what is still imperfect:

- 宫殿雕饰略重，稍微抢了一点人物惊惶的注意力
- 蛇的体量非常强，已经接近边界，后续不宜再继续放大

### p2 — pressure: 张角聚众

status: `mixed`

what landed:

- `甲子` 牌匾非常醒目，作为视觉锚点是成立的
- 张角居中、信众聚拢、村口成势，这个基本叙事没有丢
- 没有跑成神怪授书场面，也没有把张角画成明显正面英雄

what is still problematic:

- 当前图里是四卷竹简，不是 spec 和 prompt 要求的“三卷”
- 张角的脸和身位太强，更像单人角色海报，削弱了“村口聚众酝酿风暴”的社会面
- 信众虽然在场，但“从四面聚来”的动态还可以更强

### p3 — turn: 黄巾洪流

status: `good`

what landed:

- 中间右格是全页视觉高潮，这一点命中
- 夜色、火把、人潮、张角高处站位、大旗高举，都稳定成立
- 大旗没有落成细小文字，改用强符号，是对当前引擎更稳的处理
- 整格压迫感和失控感都够，能传达“乱的不是一地，而是天下”

what is still imperfect:

- 张角本人仍略有英雄式高举姿态，虽然不严重，但还可以再压低“领袖神化感”
- 人潮密度很强，后续如果再迭代，要避免把前景农具和头巾画得过满导致阅读发堵

### p4 — hook: 幽州出榜

status: `ok`

what landed:

- 底部宽景成立，城门、城墙、行人、驻足看榜关系清楚
- 榜文面积够大，位置也对，确实是这一格的主要视觉锚点
- 没有提前暗示刘备，也没有拖慢收束节奏

what is still problematic:

- 榜文本体偏空，古代榜文质感有了轮廓，但“刚贴出的招兵榜”力度还不够
- 观者动作偏稳，驻足围看的张力还可以再往前推一点
- 这格现在“构图正确”多于“命运钩子很强”

## Root Cause

`mixed`

### prompt_issue

这轮 prompt 对版式、无字、黑白纪律都约束得比较成功，但对 p2 的“三卷”控制还不够硬。

模型抓住了“手持多卷竹简”，却没有稳定执行精确数量。

### engine_issue

当前引擎在“有牌匾、有榜文、有文书”的题材上，容易在局部结构和数量上漂移。

这轮已经避开了现代公告字样，但：

- 竹简数量漂移
- 榜文细节趋向空白模板

仍然说明引擎对这类“具体可数视觉锚点”不够稳。

### spec_issue

当前 spec 本身没有明显问题，四格功能和锚点都清楚。

真正需要注意的是：p2 和 p4 都含有容易触发模型错误的“文字替代物”对象，例如竹简、牌匾、榜文。这类对象在后续 prompt 里需要更强的结构约束。

## Recommendation

`keep_as_baseline_and_iterate`

保留 run006。

它已经比旧版更适合作为下一轮的出发点，原因很直接：

- 版式对了
- 无图内字对了
- 黑白连环画系统感对了
- p3 高潮和 p4 收束都站住了

下一轮不该推翻重画，而该只修三个点：

1. p2 明确锁死为三卷竹简
2. p2 降低张角单人海报感，抬高聚众态势
3. p4 强化“刚贴出的古代招兵榜”纸张感和围观张力

## Summary

run006 是一张可留档、可继续迭代的有效候选页。

它已经满足“可评、可读、可接入后续文字渲染”的基本产品条件，但还没达到可以 promote 到 `current/` 的稳定度。

如果继续生成下一轮，建议以 run006 为 baseline 做窄幅修正，而不是重新发明整页构图。
