# Comic Image Evaluation Rubric

## 目标

这份 rubric 用来评估一张 `passage comic image` 是否真的可用。

补充原则：

- 不用“是否机械覆盖 passage 全部信息点”作为首要标准
- 用“是否把 passage 的重要内容表达充分”作为首要标准
- 如果四格或少格把内容压扁，应判为表达问题
- 如果多格是为了让关键内容真正成立，不应因“不是极简”而扣分

这里的“可用”不是只看画得漂不漂亮，而是看它是否适合当前产品链路：

1. 能表达 passage 的故事推进
2. 能支持 panel 切分
3. 能承载后续多语言文字覆盖
4. 能帮助判断问题更像出在 spec、prompt 还是 engine

这份 rubric 默认评估对象是：

- `story/<passage>/image.png`
- 对照 `passage_comic_spec_vN.json`
- 必要时回溯 `spec.json` 与 `sNN-spec.json`

## 先定评估对象

每次评估前，先明确当前评的是哪一种“可用性”。

### A. Product Usability

问题是：

这张图放进真实产品链路后，切 frame、加旁白、做多语言，能不能用？

这是主评估模式。

### B. Image-Only Story Clarity

问题是：

不看下方文字，只看图，能不能大致看懂这一页在讲什么？

这是辅助评估模式。

不要把 A 和 B 混在一起。

很多图在 A 模式下可用，在 B 模式下并不强。这不一定是失败。

## 总体判定

每张图先做一级判定：

- `Pass`
  - 可以进入切 frame 和排版阶段
- `Pass with Notes`
  - 能用，但需要记录问题，后续 prompt 或 spec 应调整
- `Borderline`
  - 勉强能用，但会拖累阅读体验，不建议作为稳定生产标准
- `Fail`
  - 不建议进入后续流程，应重做

## 五个主维度

每个维度按 1-5 分打分。

### 1. Passage Goal Match

看这张图是否完成了 `spec.json` 的 passage 目标。

判断问题：

- 图是否表达了这一段的核心推进
- 图是否保留了 passage 的冲突、转折、收束
- 图是否让读者感到这一页的情绪曲线成立

打分标准：

- 5 分：核心推进、冲突、转折、收束都成立
- 4 分：大方向成立，个别信息需靠文字补
- 3 分：能看出主题，但故事推进偏模糊
- 2 分：只剩氛围，难说清这页在讲什么
- 1 分：和 passage 目标明显不符

### 2. Panel-Level Story Fidelity

看每一格是否对齐 `passage_comic_spec_vN.json`。

逐 panel 检查：

- `story_function` 是否成立
- `moment_cn` 是否被画出来
- `must_show` 是否落地
- `must_avoid` 是否被遵守
- panel 之间节奏是否清楚

打分标准：

- 5 分：四格都清楚，关键锚点落地稳定
- 4 分：大部分清楚，少数格子锚点偏弱
- 3 分：能对上结构，但多个格子只有泛化场景感
- 2 分：很多格子只是“差不多像”，不够具体
- 1 分：基本对不上 comic spec

### 3. Comic Usability

看这张图是否适合真实的连环画产品链路。

检查项：

- panel 边界是否清楚
- panel 内主体是否集中
- panel 构图是否利于裁切
- 画面是否便于下方文字补充
- 多语言覆盖后，读者是否还能顺畅阅读

打分标准：

- 5 分：非常适合切分和配文
- 4 分：整体可用，局部需要轻微容忍
- 3 分：能切，但部分 panel 会影响阅读节奏
- 2 分：切出来也难读
- 1 分：不适合产品链路

### 3.5. Expressive Coverage

检查：

- 关键 reveal / bond / turn / consequence 是否真的被表达出来
- 页面是否只是“知道发生了什么”，还是“看懂了为什么这件事重要”
- frame 数量的增加是否换来了更清楚的内容表达
- 页面是否为了完整性堆入过多次要内容，反而削弱核心表达

打分标准：

- 5 分：重要内容表达充分，取舍清楚
- 4 分：主要内容表达到了，少量连接仍依赖文字
- 3 分：主线在，但关键表达被压扁
- 2 分：页面更像摘要卡
- 1 分：既没表达清主要内容，也没有有效取舍

### 4. Visual Specificity

看这张图是不是“这个故事的这几个时刻”，而不是泛化古风图。

检查项：

- 是否有能一眼辨识该场景的视觉锚点
- 群像场面里是否还保留特定事件信息
- hook 格是否真的有戏剧张力

打分标准：

- 5 分：特定性强，不易和别的 passage 混淆
- 4 分：多数格子有辨识度
- 3 分：主要靠旁白才能区别
- 2 分：很像通用题材插图
- 1 分：几乎没有场景特异性

### 5. Style and Character Control

看这张图是否在项目允许的风格和角色控制范围内。

检查项：

- 风格是否符合小人书 / 连环画方向
- 是否严格保持黑白灰范围，避免黑白灰之外的颜色
- 人物表情和动作是否稳定
- 角色是否没有明显跑偏
- 是否没有落入海报感、摆拍感、奇幻感

打分标准：

- 5 分：风格稳定，角色表现自然
- 4 分：总体稳定，个别细节有小偏差
- 3 分：能看，但统一性一般
- 2 分：风格或人物明显漂移
- 1 分：不在项目风格范围内

### 6. Text Style and Era Fit

看这张图里一旦出现文字、伪文字、牌匾、榜文、旗号、字形符号时，是否符合古代语境和项目气质。

检查项：

- 是否出现明显现代词汇
- 是否出现现代公告、商业、招聘、广告语感
- 榜文、牌匾、旗面是否像古代物件，而不是现代排版物
- 旗号、符号、图形是否传达了正确的历史语感，而不是任意装饰性符号
- 当前 panel 是否过度依赖“必须读懂文字”才能成立
- 文字是否会主动破坏沉浸感

打分标准：

- 5 分：无明显文字问题，或文字/伪文字完全符合时代感
- 4 分：有轻微文字问题，但不明显出戏
- 3 分：存在时代感风险，需要人工容忍
- 2 分：明显出现错时代词汇或现代公告感
- 1 分：文字强烈破坏沉浸感，直接影响可用性

## 两个辅助维度

这两个维度不一定每次都必须打分，但建议记录。

### A. Image-Only Clarity

不看旁白时，这页图能看懂多少。

### B. Refinement Cost

这张图如果人工去 chatbot 里 refine，需要花多大成本。

建议用：

- `low`
- `medium`
- `high`

## 问题归因框架

打完分之后，不要立刻说“模型不行”。

先按下面顺序判断。

### 一类：Spec 问题

如果问题来自这些情况，更像是 spec：

- passage 目标过满，一页承担太多信息
- comic spec 既要求“无字”，又要求画面承担大量文字语义
- comic spec 没有明确区分“允许的古代语感字样”与“应避免的现代可读文本”
- panel 的 `moment_cn` 不够可视化
- `must_show` 太多，视觉优先级不清
- hook 的戏剧点在文字里成立，在画面里不成立

常见信号：

- prompt 已经忠实执行，但出来仍然不清楚
- 多个引擎都会在同一格失败

### 二类：Prompt 问题

如果问题来自这些情况，更像是 prompt：

- 画面要求太散，没有强中心
- 气氛写得多，视觉锚点写得少
- must-have 元素提了，但主次不分
- 同时要求太多层信息，模型只保留了“像”
- 对“不该出现什么”约束不够硬

常见信号：

- 小改 prompt 结构后，结果明显变好
- 同一个 spec 用不同 prompt 写法差异很大

### 三类：Engine 问题

如果问题来自这些情况，更像是 engine：

- 大群像里稳定丢失关键主体
- 版式经常乱掉
- 指定风格很难锁定
- 同 prompt 多次抽样波动极大
- 某些元素总是画不出来或总画错

常见信号：

- prompt 已经很明确，但结果仍高频失败
- 失败模式在同一引擎里反复一致
- 换引擎后明显改善

## 建议评估流程

每次评估按下面顺序走。

### Step 1

先只看图，做 `Image-Only Clarity` 速判。

问三个问题：

- 我能看出这页在讲什么吗
- 我能看出每格的功能不同吗
- 有没有至少一个强视觉锚点让我记住这页

### Step 2

再对照 `passage_comic_spec_vN.json`。

逐格核对：

- `moment_cn`
- `must_show`
- `must_avoid`
- `story_function`

### Step 3

如果 comic spec 基本对了，再回看 `spec.json` 和 `sNN-spec.json`。

问：

- comic spec 是否已经把原 passage 过度压扁
- scene 的关键信息是否在改编时丢了
- 这页到底是“情绪页”还是“信息页”

### Step 4

最后再归因到：

- `spec_issue`
- `prompt_issue`
- `engine_issue`
- `mixed`

## 建议输出格式

建议每次评估都输出一个统一 JSON 或 markdown 结构。

推荐字段：

```json
{
  "asset": "story/cp001-p01/image.png",
  "mode": "product_usability",
  "overall": "pass_with_notes",
  "scores": {
    "passage_goal_match": 4,
    "panel_story_fidelity": 4,
    "comic_usability": 4,
    "visual_specificity": 3,
    "style_and_character_control": 4,
    "text_style_and_era_fit": 2,
    "image_only_clarity": 3
  },
  "panel_notes": [
    {
      "panel_id": "p1",
      "status": "good",
      "notes": "龙椅、大蛇、朝臣惊散都成立，是强开场。"
    },
    {
      "panel_id": "p2",
      "status": "ok",
      "notes": "张角聚众成立，但风暴酝酿感偏弱。"
    }
  ],
  "root_cause": "mixed",
  "root_cause_notes": [
    "comic spec 同时要求无字和带文字语义的视觉物体",
    "第3格与第4格的视觉锚点排序不够硬"
  ],
  "refinement_cost": "medium",
  "recommendation": "keep_and_refine_prompt"
}
```

## 推荐决策标签

评估完成后，给一个动作建议：

- `keep`
- `keep_and_refine_prompt`
- `keep_as_temp`
- `regen_same_spec_new_prompt`
- `rewrite_comic_spec_then_regen`
- `switch_engine_or_escalate`

## cp001-p01 示例

下面用 `story/cp001-p01/image.png` 做示例。

### 总评

- `overall`: `pass_with_notes`
- 这页可以进入产品链路
- 但还不足以作为高标准样板页

### 示例打分

- `Passage Goal Match`: 4
- `Panel-Level Story Fidelity`: 4
- `Comic Usability`: 4
- `Visual Specificity`: 3
- `Style and Character Control`: 4
- `Text Style and Era Fit`: 2
- `Image-Only Clarity`: 3

### 示例判断

#### p1

强。

龙椅、大蛇、朝臣惊散、王朝不祥都成立。

#### p2

合格但不够锐。

张角和信众有了，但“从小人物变成大风暴”的扩张感还不够。

#### p3

有气势，但特定性不足。

更像“泛化的大乱群像”，还不够稳定地像“黄巾起义那个时刻”。

#### p4

能收束，但 hook 偏弱。

更像“有人看公告”，还不够像“这张榜会改写命运”。

### 示例归因

`mixed`，但更偏 `spec + prompt`。

原因：

1. comic spec 一边要求无字，一边又要求榜文、旗号、甲子标记承担语义
2. prompt 对第 3 格和第 4 格的视觉锚点排序不够狠
3. 当前图已经说明引擎能接近目标，但还没有被约束到稳定命中
4. 一旦出现可读文字，还缺少“时代语感”这个独立评估维度

### 示例动作建议

`keep_and_refine_prompt`

不建议直接判定为引擎失败。

先做：

1. 明确“无字”规则的例外
2. 收紧每格的单一视觉锚点
3. 区分“必须图像表达”与“允许由旁白补齐”的信息

## 一个关键原则

不要要求一张 comic image 同时做到三件事：

1. 图像本身讲全故事
2. 完全无字
3. 还要承载大量特定历史信息

三者同时拉满，通常会互相打架。

更稳的做法是先明确优先级：

- 第一优先：panel 可读性
- 第二优先：故事节奏
- 第三优先：特定信息锚点
- 其余信息由下方文字补齐

这样才更适合当前这条小人书生产链。
