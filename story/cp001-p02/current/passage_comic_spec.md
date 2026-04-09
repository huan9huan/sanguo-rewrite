# Passage Comic Spec

## Meta

- chapter: `cp001`
- passage: `p02`
- page_id: `cp001-p02-page-01`
- title: `英雄叹息`

## Comic Goal

把 `cp001-p02` 改写成一页四格连环画，让读者在一页内读清三件事：

1. 刘备这个人不凡，却过得很苦
2. 榜前一声叹息，把压抑多年的志向暴露出来
3. 张飞一出现，就把叹息变成了行动

这一页的重点不是大战，而是人物第一次真正立起来。

## Adaptation Rules

- 一格只讲一个清楚的动作瞬间
- 第二格“榜前长叹”是全页情绪中心
- 第三格“张飞厉喝”是全页动作爆点
- 所有文字放在 frame 下方的文字区，不放在图里
- 采用黑白小人书 / 连环画式速写插图
- 内容少而精，突出人物和故事推进

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
- scene_id: `cp001_p02_s1`
- story_function: `setup`
- moment: `楼桑树下的少年刘备，贵气种子与贫苦现实同时立住`
- camera: `中景偏叙事，人物与楼桑树同框`
- must_show:
  - 少年刘备
  - 楼桑大树
  - 贫苦但不寒酸的气质
- must_avoid:
  - 做成儿童插画
  - 细讲家谱和私塾细节

### Panel 2

- panel_id: `p2`
- scene_id: `cp001_p02_s2`
- story_function: `pressure`
- moment: `二十八岁的刘备站在榜前长叹`
- camera: `中景，榜文与刘备同框`
- must_show:
  - 刘备站在榜前
  - 慨然长叹
  - 周围人各忙各的
- must_avoid:
  - 把叹息画成软弱
  - 过度拥挤的街景

### Panel 3

- panel_id: `p3`
- scene_id: `cp001_p02_s3`
- story_function: `reveal`
- moment: `张飞厉声一喝，打破沉寂`
- camera: `动态中景，张飞闯入画面`
- must_show:
  - 张飞豹头环眼
  - 声若巨雷的动作感
  - 刘备转头看他
- must_avoid:
  - 把张飞画成莽夫怪相

### Panel 4

- panel_id: `p4`
- scene_id: `cp001_p02_s3`
- story_function: `hook`
- moment: `二人说定出资招兵，同入村店饮酒，门口影子一动`
- camera: `收束镜头，店门与门口影子形成尾钩`
- must_show:
  - 刘备与张飞并肩入店
  - 店门口的影子
  - 下一幕将有人登场的钩子
- must_avoid:
  - 过早露出关羽正脸

## Output Pairing

本 spec 对应：

- frame-level prompts
- `comic_reader_layout_v1.json`
- generated page prompt
