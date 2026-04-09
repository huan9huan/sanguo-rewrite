# Comic Image Evaluation — cp001-p02 v2

## 1. Asset

| item | path |
|------|------|
| image | `story/cp001-p02/image.png` |
| comic spec | `story/cp001-p02/passage_comic_spec_v1.json` |
| page prompt | `story/cp001-p02/passage_comic_v1_generated/page_prompt.txt` |
| passage spec | `story/cp001-p02/spec.json` |
| scene specs | `s01-spec.json`, `s02-spec.json`, `s03-spec.json` |
| evaluation mode | Product Usability |

## 2. Overall Verdict

**Pass with Notes**

图片实际为 4 格布局（上宽两格 + 下窄两格），黑白连环画风格，无文字，panel 边界清晰。四格内容依次对应：树下人物、榜前人物、猛将厉喝、两人入店——与 comic spec 的 story_function 排列（setup → pressure → reveal → hook）基本对齐。整体可用，能进入产品链路。但多格在人物辨识度、年龄准确性和视觉锚点锐度上有偏差，需要记录问题以便后续 prompt 迭代。

## 3. Scores

| dimension | score | note |
|-----------|-------|------|
| Passage Goal Match | 4 | 刘备不凡与落魄、榜前叹息、张飞登场、二人入店的故事弧成立 |
| Panel Story Fidelity | 3 | 四格 story_function 对上了，但 p1 没有少年感，p3 缺少刘备转头，p4 影子钩子不明显 |
| Comic Usability | 4 | 4 格边界清晰，主体集中，无文字，适合切 frame 和加旁白 |
| Visual Specificity | 3 | 整体偏泛化古风，p2 和 p4 缺少强视觉锚点区分 |
| Style & Character Control | 3 | 黑白连环画风格到位，但 p3 出现了非 spec 角色且张飞辨识度不足 |
| Image-Only Clarity | 3 | 不看文字能大致猜到"树下、榜前、冲突、入店"，但具体故事靠猜 |
| Refinement Cost | medium | prompt 调整可改善，不需要重写 spec |

## 4. Panel Notes

### p1 (setup): 楼桑树下的少年刘备 — **ok**

- **spec 要求**: 少年刘备 + 楼桑大树 + 不凡但贫苦的底色
- **what landed**: 大树非常突出，树冠撑开有"车盖"感；人物站在树下仰望，构图成立；整体气质沉稳
- **what is missing**:
  - 人物年龄偏大，看不出来是"少年"刘备，更像是成年男子
  - "不凡但贫苦"的矛盾感没有立住——衣着看不出贫苦
  - 缺少"贵气种子"的视觉暗示

### p2 (pressure): 二十八岁刘备榜前长叹 — **ok**

- **spec 要求**: 刘备站在榜前 + 慨然长叹 + 周围人各忙各的
- **what landed**: 人物站在建筑前有看榜的姿势；背景有人群走动，"众人照常经过"的对比成立；整体孤独感有
- **what is missing**:
  - 榜文不够明确——看不到明显的榜文张贴物
  - "慨然长叹"的情绪不够强烈，表情偏平静
  - 周围人的"卖菜、挑担、赶驴"细节缺失，背景人群泛化

### p3 (reveal): 张飞厉声一喝 — **ok**

- **spec 要求**: 张飞豹头环眼 + 声若巨雷的动作感 + 刘备转头看他
- **what landed**: 画面有动态感，猛将闯入有"炸开"的势头；人物气势逼人
- **what is missing**:
  - 背景出现了一个女子形象（spec 中没有这个角色，可能是引擎自由发挥）
  - 张飞的"豹头环眼"特征不够鲜明，没有辨识度
  - 刘备"转头看他"的反应链没有画出——画面只有张飞没有刘备
  - spec 要求 `must_avoid` "把张飞画成莽夫怪相"，这方面控制得可以

### p4 (hook): 二人并肩入店，门口影子 — **ok**

- **spec 要求**: 刘备与张飞并肩入店 + 店门口影子 + 下一幕将有人登场的钩子
- **what landed**: 两人并肩走进室内场景成立；室内有桌椅，像村店
- **what is missing**:
  - "门口影子先动了一下"的钩子——这是全页最重要的收束悬念，图里完全没有
  - 两人的体型差异不够（张飞应该更魁梧）
  - 缺少"酒还没上来"的空桌氛围

## 5. Root Cause

**mixed，偏 prompt_issue**

原因分析：

1. **prompt_issue（主因）**: prompt 对每格的视觉锚点排序不够硬。例如 p4 的"门口影子"是 hook 的核心，但在 prompt 中没有获得足够的视觉优先级强调。p3 没有强调刘备必须在画面中，导致画面只有张飞一人。p1 的"少年"年龄特征没有被足够约束。

2. **engine_issue（次因）**: p3 出现了 spec 中没有的女性角色，说明模型在处理多人场景时有自由发挥倾向。p1 的人物年龄偏移也属于引擎对"少年"概念的弱遵循。

3. **spec 层面基本合理**: 四格的 story_function 分配（setup → pressure → reveal → hook）逻辑清楚，每格的信息量适中，不需要重写 comic spec。

## 6. Recommendation

**keep_and_refine_prompt**

具体建议：

1. **强化年龄和体貌约束**: p1 prompt 应明确"约十岁少年，身材矮小"，p4 应强调"两人体型差异明显，一人魁梧一人修长"。

2. **收紧每格的核心视觉锚点为单一焦点**:
   - p1: 焦点从"不凡+贫苦"收为"少年仰望大树"（一个动作就够了）
   - p2: 焦点从"孤独+榜文+人群"收为"一人对着榜文叹气"
   - p3: 焦点明确为"张飞和刘备同框，张飞闯入刘备转头"
   - p4: 焦点必须包含"门口影子"，这是 hook 唯一需要的视觉信息

3. **增加负面约束**: p3 明确避免出现无关角色（"画面只允许出现张飞和刘备两人，不要出现其他角色"）。

4. **不需要重写 comic spec**: spec 的四格结构和 story_function 分配合理，问题主要出在 prompt 的视觉优先级排序。
