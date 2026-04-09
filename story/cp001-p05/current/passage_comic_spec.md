# Passage Comic Spec v2

## Passage

- passage: `cp001-p05`
- title: `英雄与小人`
- page_id: `cp001-p05-page-01`

## Comic Goal

把 p05 做成一页五格连环画：颍川火光与曹操初亮相、曹操与三兄弟短短相看、槛车中的卢植、张飞欲劫囚被刘备拦下、槛车远去后三兄弟带着怒气转回涿郡。

## Layout

- panel_count: `5`
- layout_pattern: `top-wide / upper-two / lower-two / bottom-wide`
- reading_direction: `ltr`

## Adaptation Rules

- 一格只讲一个清楚的动作瞬间
- 第一格先立住战场之大和曹操初亮相
- 第二格给曹操一个短而锐利的人物互动，不展开，不传记化
- 第三格槛车中的卢植是全页最冷的一格
- 第四格张飞拔刀、刘备拦刀是全页最大的动作爆点
- 第五格不再塞董卓，改成槛车远去后的冷收束，让怒气悬着
- 所有文字放在 frame 下方的文字区，不放在图里
- 采用黑白小人书/连环画式速写插图

## Panels

### p1

- story_function: `setup`
- moment: `颍川方向火光冲天，三兄弟赶到时仗已打完；远处一彪军马截杀败军，为首正是曹操。`
- camera: `远景宽格，前景是三兄弟勒马远望，远处火光与曹操截杀败军同框。`

### p2

- story_function: `new_hero_glance`
- moment: `营前短短相看——曹操勒马收缰，从三兄弟身边经过，彼此记住了对方。`
- camera: `中景，曹操骑马偏前经过，刘备在地面回望，关张在侧，皇甫嵩军营作背景。`

### p3

- story_function: `turn`
- moment: `半路槛车迎面而来，车里坐着卢植。`
- camera: `中景，槛车占画面中心，刘备下马趋前。`

### p4

- story_function: `pressure`
- moment: `听完蒙冤原委，张飞怒拔刀要劫囚，刘备伸手拦住，关羽在后沉着不语。`
- camera: `动态中景，刀刚出鞘，刘备伸臂拦住，卢植仍在车中，槛车缓缓前行。`

### p5

- story_function: `closure`
- moment: `槛车远去，三兄弟立在路边望着尘土，怒气未消，关羽低声劝回涿郡。`
- camera: `横向收束格，槛车远去成小影，三兄弟站在前景，张飞仍握刀未平，刘备沉默，关羽侧身劝言。`
