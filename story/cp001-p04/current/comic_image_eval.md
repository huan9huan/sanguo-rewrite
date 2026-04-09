# Comic Image Evaluation — cp001-p04 refined

## Asset

- passage: `cp001-p04`
- run: `comic/run001`
- image: `refined.jpeg`
- baseline_compare: `image.png`
- comic spec: `passage_comic_spec.json`
- prompt: `page_prompt.txt`
- evaluation mode: `product_usability` + `image_only_story_clarity`

## Overall Verdict

`Pass with Important Notes`

`refined.jpeg` 比原始 `image.png` 更接近可用候选。

这次最重要的进步有三点：

1. 全页回到了黑白灰，没有原图里那些黄巾的黄色点缀
2. 第三格战术格和第五格卢植军帐格更稳、更统一
3. 整体画风更像一套同源的小人书页面，不再有局部出戏的颜色问题

但它还没有完全过关，因为第二格的核心动作被削弱了：

- spec 要的是“一矛一刀，两个瞬间叠在一个画面”
- 现在这格主要只剩下张飞刺邓茂
- 关羽斩程远志这一半几乎没有稳定落地

所以这版已经可以作为更强的 baseline，但如果要直接 promote，我会先提醒你：它牺牲了一部分第二格的信息完整度。

## Scores

| 维度 | 分数 | 说明 |
|------|------|------|
| Passage Goal Match | 4/5 | 大兴山初战、战术、夹攻、投卢植这条主线成立 |
| Panel Story Fidelity | 3/5 | p1、p3、p4、p5 稳，p2 信息缺了一半 |
| Comic Usability | 4/5 | 五格边界清楚，适合切 frame 和加旁白 |
| Visual Specificity | 4/5 | 多数格子比原版更清楚、更稳定 |
| Style and Character Control | 4/5 | 黑白灰统一，人物关系更稳 |
| Text Style and Era Fit | 5/5 | 无图中文字，时代感没有明显问题 |
| Image-Only Clarity | 4/5 | 单看图能读出初战、谋策、夹击、投军，但 p2 会少掉关羽那一击 |
| Refinement Cost | low_to_medium | 不必推翻重来，但 p2 值得补回“双瞬间” |

## Panel Notes

### p1 — setup: 五百对五万

status: `good`

**what landed:**

- 兵力悬殊很清楚
- 刘备居中、关张分列两侧的关系成立
- 五百人虽少但气势不散，这一点比原版更稳

**what is still imperfect:**

- 黄巾军的“披发、黄巾抹额”已经不靠颜色来传达了，这是进步
- 但人物细部仍有一点泛化，不过不影响整体功能

### p2 — pressure: 一矛一刀

status: `ok_with_issue`

**what landed:**

- 张飞一矛刺出的速度感很强
- 这一格确实更快、更利落了

**what is still problematic:**

- 关羽斩程远志这一半几乎没有清楚落地
- 现在更像“一矛”而不是“一矛一刀”
- 这会削弱 spec 里“张飞和关羽两种杀法同时立住”的设计

### p3 — turn: 油灯下画线

status: `good`

**what landed:**

- 刘备用手指在地图上画线的动作清楚
- 油灯是唯一光源，气氛收住了
- 关羽张飞在旁等待的关系也更自然

**what is still imperfect:**

- 这一格已基本稳定

### p4 — bond: 三路夹攻

status: `good`

**what landed:**

- 三路方向感清楚
- 从三个方向压向中央的结构成立
- 贼军崩溃的合力感也有

**what is still imperfect:**

- 俯视感可以再更强一点
- 但当前已经够用

### p5 — hook: 卢植军帐

status: `good`

**what landed:**

- 卢植拍肩的瞬间成立
- 刘备微微低头的克制感对了
- 关羽张飞站位也比较稳

**what is still imperfect:**

- 这一格比原版更自然
- 没有明显硬伤

## Comparison to Original Image

### Better than `image.png`

- 去掉了黄巾的黄色点缀
- 全页风格更统一
- p3 和 p5 更稳

### Worse or still risky

- p2 丢掉了“关羽那一刀”的明确性
- 第二格的信息密度被简化得过头

## Root Cause

`mixed，偏 engine_issue`

### prompt_issue

prompt 已经明确要求第二格是“一矛一刀，两个瞬间叠在一个画面”，所以从任务定义看并不模糊。

### engine_issue

模型似乎在追求“动作干脆”和“画面清爽”时，自然把最强的一个瞬间保留了下来，把另一个瞬间弱化掉了。

也就是说：

- 它听懂了“快”
- 但没稳定执行“两个瞬间并置”

## Recommendation

`keep_and_refine`

建议保留 `refined.jpeg` 作为当前更强的迭代基线。

下一步最值得继续补的一件事非常单一：

1. p2 必须把关羽那一刀补回来，让“一矛一刀”重新成立

其他格子目前都比原版更好，不建议大改。

## Summary

`refined.jpeg` 已经把 `p04` 从“颜色出戏、局部不稳”拉回到一套更成熟的黑白连环画页面。

它最大的未完成点只剩一个：第二格现在太像“只看张飞”，还没有把关羽那一刀一起稳稳立住。除此之外，这版已经是明显优于原图的方向样本。
