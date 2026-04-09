# Passage Comic Spec v1

## Passage

- passage: `cp001-p05`
- title: `英雄与小人`
- page_id: `cp001-p05-page-01`

## Comic Goal

把 p05 做成一页五格连环画：颍川火光与曹操初亮相、槛车中的卢植、张飞欲劫囚被刘备拦下、三兄弟救董卓后遭白身之辱、张飞提刀欲回帐杀人。

## Layout

- panel_count: `5`
- layout_pattern: `top-wide / upper-two / lower-two / bottom-wide`
- reading_direction: `ltr`

## Adaptation Rules

- 一格只讲一个清楚的动作瞬间
- 第一格要先把战场之大和曹操亮相压缩在同一页开头
- 第二格槛车中的卢植是全页最冷的一格
- 第三格张飞欲劫囚、刘备拦刀是第一次爆点
- 第四格“现居何职”是全页最屈辱的一格
- 第五格张飞提刀欲回帐杀人是全页真正的结尾爆点
- 所有文字放在 frame 下方的文字区，不放在图里
- 采用黑白小人书/连环画式速写插图

## Panels

### p1

- story_function: `setup`
- moment: `颍川方向火光冲天，三兄弟赶到时仗已打完；远处一彪军马截杀败军，为首正是曹操。`
- camera: `远景宽格，前景是三兄弟勒马远望，远处火光与曹操截杀败军同框。`

### p2

- story_function: `turn`
- moment: `半路槛车迎面而来，车里坐着卢植。`
- camera: `中景，槛车占画面中心，刘备下马趋前。`

### p3

- story_function: `pressure`
- moment: `张飞怒拔刀要劫囚，刘备伸手拦住。`
- camera: `动态中景，刀刚出鞘，刘备伸臂拦住，关羽在后沉着看着。`

### p4

- story_function: `core_humiliation`
- moment: `三兄弟浴血救回董卓，董卓只问：现居何职？刘备答：白身。董卓当场轻慢。`
- camera: `中景，帐中站位清楚，董卓在前，刘备在下答话，关张在后。`

### p5

- story_function: `hook`
- moment: `三人出帐，张飞提刀转身就要回去杀董卓，刘备关羽同时去拦。`
- camera: `横向收束格，张飞在前猛回身，刀已提起，刘备和关羽在后追拦。`
