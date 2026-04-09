# Comic Image Evaluation — cp001-p02

## 1. Asset

| item | path |
|------|------|
| image | `story/cp001-p02/image.png` |
| comic spec | `story/cp001-p02/passage_comic_spec_v1.json` |
| page prompt | `story/cp001-p02/passage_comic_v1_generated/page_prompt.txt` |
| passage spec | `story/cp001-p02/spec.json` |
| evaluation mode | Product Usability |

## 2. Overall Verdict

**Fail**

这张图与 comic spec 完全不匹配。Spec 要求 4 格（top-two / middle-wide / bottom-wide），内容是楼桑树下少年刘备、榜前长叹、张飞厉喝、二人入店。实际图片是 6 格 2×3 网格，内容全是战场行军和室内密谋场景，没有任何一格对上 spec 的 story_function 或 moment。这不是"偏弱"的问题，而是这张图属于另一个 passage（甚至可能是 cp001-p04 初试锋芒的战场场景）。无法进入当前产品链路。

## 3. Scores

| dimension | score | note |
|-----------|-------|------|
| Passage Goal Match | 1 | 目标是"刘备从文字介绍变成活的人"，图中没有刘备相关任何瞬间 |
| Panel Story Fidelity | 1 | 6 格 vs spec 的 4 格，内容完全对不上 |
| Comic Usability | 2 | 6 格网格边界清楚、主体集中，切 frame 技术上可行，但内容全部错误 |
| Visual Specificity | 2 | 图本身有战场细节和室内场景，但不是"这个故事这个时刻" |
| Style & Character Control | 3 | 黑白连环画风格基本到位，线条有动势，但人物不可辨识为刘备/张飞 |
| Image-Only Clarity | 2 | 能看出是"古代军事故事"，但具体讲什么不清楚 |
| Refinement Cost | — | 不适用，这张图不应 refine 而应重生成 |

## 4. Panel Notes

逐格对照 spec：

### p1 (setup): 楼桑树下的少年刘备 — **weak**

- **spec 要求**: 少年刘备 + 楼桑大树 + 不凡但贫苦的底色
- **实际内容**: 顶部左格是骑兵行军场景，多名骑马士兵 + 远处步兵阵列
- **what landed**: 无
- **what is missing**: 少年刘备、楼桑大树、贫苦与不凡的气质全无

### p2 (pressure): 二十八岁刘备榜前长叹 — **weak**

- **spec 要求**: 刘备站在榜前 + 慨然长叹 + 周围人各忙各的
- **实际内容**: 顶部中格是骑马人物动态场景，无榜文、无叹息
- **what landed**: 无
- **what is missing**: 榜文、刘备、孤独感、叹息动作全无

### p3 (reveal): 张飞厉声一喝 — **weak**

- **spec 要求**: 张飞豹头环眼 + 声若巨雷的动作感 + 刘备转头看他
- **实际内容**: 顶部右格是室内三人围桌看地图，有烛光
- **what landed**: 室内场景有基本的"密谋"氛围
- **what is missing**: 张飞、豹头环眼、厉喝动作、刘备反应全无

### p4 (hook): 二人入店饮酒，门口影子 — **weak**

- **spec 要求**: 刘备与张飞并肩入店 + 店门口影子 + 钩子
- **实际内容**: 底部右格是两人室内对话，但不是村店场景
- **what landed**: 有两人对话的基本构图
- **what is missing**: 村店、并肩入店的动势、门口影子钩子全无

## 5. Root Cause

**prompt_issue + engine_issue (mixed)**

原因分析：

1. **prompt_issue**: prompt 明确写了 4 格、top-two / middle-wide / bottom-wide 版式，但模型完全无视了版式指令，输出了 2×3 共 6 格。这可能是 prompt 中的格式约束不够硬——对版式的描述偏叙述性而非强制性。

2. **engine_issue**: 模型完全没有遵循"无文字""mobile 竖屏""4 格"这些核心约束，输出了完全不同的场景内容（战场 vs 榜前叹息）。这说明模型对长 prompt 中多个 panel 的逐格要求有严重的注意丢失，或者这张图根本不是用当前 prompt 生成的（可能是其他 passage 的图被误放）。

3. 需要确认：这张 image.png 是否确实是 `passage_comic_v1_generated/page_prompt.txt` 生成的？如果不是，问题分类应调整为"asset mismatch"。

## 6. Recommendation

**rewrite_comic_spec_then_regen**

具体建议：

1. **先确认 asset 归属**：检查这张 image.png 是否属于其他 passage（如 p04 的战场场景被误放到 p02 目录）。如果是归属错误，直接替换正确的图片即可，不需要重写 spec。

2. **如果确认是同 prompt 生成的**：说明模型对 4 格逐格叙事 prompt 的遵循率极低。建议：
   - 将 prompt 拆成更短的版本，强化版式约束的权重
   - 考虑在 prompt 开头用更直接的结构化格式标注 `[LAYOUT: 4 panels, top-two / middle-wide / bottom-wide]`
   - 减少每格的描述长度，让核心视觉锚点更突出

3. **风格本身可用**：黑白连环画风格、线条质量、panel 边界清晰度都基本合格。问题不在风格，在内容匹配。
