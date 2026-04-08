# Passage Comic Spec

## Meta

- chapter: `cp001`
- passage: `p03`
- page_id: `cp001-p03-page-01`
- title: `桃园结义`

## Comic Goal

把 `cp001-p03` 改写成一页四格连环画，让读者在一页内读清三件事：

1. 关羽登场
2. 三兄弟结义
3. 结义之后立刻成军并上路

这一页不是单张海报，而是连续讲故事的一页。人物关系、动作和故事推进比环境细节更重要。

## Adaptation Rules

- 一格只讲一个清楚的动作瞬间
- 一页内必须让三兄弟形象保持一致
- 第二格“桃园结义”是全页视觉中心
- 所有文字放在 frame 下方的文字区，不放在图里
- 风格采用黑白小人书 / 连环画式速写插图
- 内容少而精，突出故事性，不堆细节

## Page Format

- panel_count: `4`
- reading_direction: `ltr`
- layout_pattern: `top-two / middle-wide / bottom-wide`

## Style

- style_key: `bw_lianhuanhua_sketch`
- text_policy: `image_without_text + mobile_frame_text_blocks`

整页风格提示：

黑白小人书 / 连环画式速写插图。线条可以细，但必须有动势和呼吸感。人物动作鲜活，故事瞬间清楚，人物大于景物，背景从简。不要彩绘，不要海报感，不要摆拍。

## Panels

### Panel 1

- panel_id: `p1`
- scene_id: `cp001_p03_s1`
- story_function: `reveal`
- moment: `关羽推车入店，刘备起身相看，张飞也被吸引`
- camera: `中景，门口斜切入画`
- must_show:
  - 关羽高大入门
  - 刘备起身
  - 张飞在旁前倾
- must_avoid:
  - 酒馆背景过满
  - 把重点放成店内杂物

### Panel 2

- panel_id: `p2`
- scene_id: `cp001_p03_s2`
- story_function: `core oath`
- moment: `三人面对天地焚香跪拜，正式结义`
- camera: `中远景，稳定正面构图`
- must_show:
  - 刘备居中
  - 关羽沉稳
  - 张飞最有热气
  - 简朴香案
- must_avoid:
  - 桃花喧宾夺主
  - 仪式感过度华丽

### Panel 3

- panel_id: `p3`
- scene_id: `cp001_p03_s3`
- story_function: `momentum`
- moment: `好马进庄，三兄弟一下子有了成军气象`
- camera: `横向宽格，中景偏广`
- must_show:
  - 马队进庄
  - 刘备接势
  - 关羽试刀
  - 张飞执矛
- must_avoid:
  - 解释流程式拼贴

### Panel 4

- panel_id: `p4`
- scene_id: `cp001_p03_s3`
- story_function: `closure`
- moment: `三兄弟带着乡勇正式上路`
- camera: `横向收束镜头`
- must_show:
  - 三兄弟披甲持兵
  - 乡勇跟随
  - 明确的出发感
- must_avoid:
  - 像阅兵照
  - 人群杂乱无中心

## Output Pairing

本 spec 对应：

- frame-level prompts
- `comic_reader_layout_v2.json`
