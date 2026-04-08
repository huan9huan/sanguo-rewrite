# Passage Comic Spec

## Meta

- chapter: `cp001`
- passage: `p01`
- page_id: `cp001-p01-page-01`
- title: `乱世序幕`

## Comic Goal

把 `cp001-p01` 改写成一页四格连环画，让读者在一页内读清三件事：

1. 汉朝气数将尽，朝堂烂透了
2. 张角从落第秀才变成天公将军，天下大乱
3. 幽州出榜招兵——这张榜文会引出什么人？

这一页的重点不是具体人物，而是时代崩塌的磅礴感和"天下将变"的紧迫氛围。

## Adaptation Rules

- 一格只讲一个清楚的历史瞬间
- 第一格"龙椅惊蛇"是全页氛围起点
- 第三格"黄巾洪流"是全页视觉高潮
- 所有文字放在 frame 下方的文字区，不放在图里
- 采用黑白小人书 / 连环画式速写插图
- 大场面用远景，关键瞬间用中景，保持节奏
- 人物群像大于个体细节，这是时代画卷，不是肖像画

## Page Format

- panel_count: `4`
- reading_direction: `ltr`
- layout_pattern: `top-wide / middle-two / bottom-wide`

## Style

- style_key: `bw_lianhuanhua_sketch`
- text_policy: `image_without_text + mobile_frame_text_blocks`

整页风格提示：

黑白小人书 / 连环画式速写插图。这一页是全景式的乱世画卷，线条要有历史厚重感。大场面需有纵深和气势，小瞬间要有细节和张力。人物群像为主，不做个体肖像。背景从简但要有时代感。不要彩绘，不要海报感，不要摆拍。

## Panels

### Panel 1

- panel_id: `p1`
- scene_id: `cp001_p01_s1`
- story_function: `setup`
- moment: `温德殿异象——大青蛇盘踞龙椅，天降警告，帝座空悬`
- camera: `宽景纵深，殿内龙椅上的蛇与惊散的百官同框`
- must_show:
  - 龙椅上的大青蛇
  - 空悬的帝座
  - 惊惶散去的朝臣
- must_avoid:
  - 做成恐怖片
  - 过度血腥或奇幻感
  - 细讲每一个异象

### Panel 2

- panel_id: `p2`
- scene_id: `cp001_p01_s2`
- story_function: `pressure`
- moment: `张角得天书，信众如滚雪球般聚拢，家家门口写上"甲子"`
- camera: `中景，张角居中手持书卷，身后信众成势`
- must_show:
  - 张角
  - 三卷天书
  - 聚拢的信众
  - "甲子"标记
- must_avoid:
  - 南华老仙的奇幻场面
  - 让张角成为正面英雄
  - 过度展开宫廷阴谋细节

### Panel 3

- panel_id: `p3`
- scene_id: `cp001_p01_s2`
- story_function: `turn`
- moment: `星夜举兵，数十万人裹黄巾，"苍天已死，黄天当立"`
- camera: `远景转中景，黄巾洪流如潮`
- must_show:
  - 黄巾信众人潮
  - 火把与夜色
  - "天公将军"大旗
- must_avoid:
  - 把起义画成正义运动
  - 详细战斗场面
  - 美化张角

### Panel 4

- panel_id: `p4`
- scene_id: `cp001_p01_s3`
- story_function: `hook`
- moment: `幽州城门出榜招兵——榜文贴出，无人知谁会来`
- camera: `收束中景，城门口榜文与来往百姓`
- must_show:
  - 城门口的招兵榜文
  - 来往百姓
  - 平静中的张力
- must_avoid:
  - 提前暗示刘备
  - 榜文上写太多字
  - 拖慢收束节奏

## Output Pairing

本 spec 对应：

- frame-level prompts
- `comic_reader_layout_v1.json`
- generated page prompt
