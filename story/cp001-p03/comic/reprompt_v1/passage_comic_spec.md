# Passage Comic Spec — Run003

## Meta

- chapter: `cp001`
- passage: `p03`
- page_id: `cp001-p03-page-01`
- title: `桃园结义`
- run: `run003`

## Comic Goal

把 `桃园结义` 从“四格摘要”改成“一页七格的长页叙事”。

这页不是只讲一个名场面，而是要让一个没有三国知识的读者也能顺着读清整段 passage：

- 关羽为什么重要
- 三个人为什么立刻结成兄弟
- 结义具体意味着什么
- 他们怎么从空有热血变成真能起兵
- 他们怎样从乡间桃园走进官府和天下大局

## Adaptation Rules

- 改成 `7` 格，而不是 `4` 格摘要式压缩
- 一格只做一个明确叙事动作，不做说明书拼贴
- 关羽登场必须拆成两格：`亮相` 和 `识人相认`
- 桃园结义必须拆成两格：`提议` 和 `立誓`
- 起兵过程拆成三步：`困境与赠礼`、`兵器与成军`、`入官府`
- 所有文字放在 frame 下方，不进图
- caption 只用 narrator，不放对白气泡，不把 minor character 变成主语
- 图片必须让没读正文的人也能看出“关系变化”和“局势推进”
- 保持黑白小人书 / 连环画速写，不做彩色海报，不做游戏 splash art

## Page Format

- panel_count: `7`
- reading_direction: `ltr`
- layout_pattern: `top-wide / upper-two / center-wide / lower-two / bottom-wide`
- mobile_reading: `image -> text -> image -> text`

推荐布局：

1. `P1` 上方全宽
2. `P2` 左上半宽
3. `P3` 右上半宽
4. `P4` 中部全宽
5. `P5` 左下半宽
6. `P6` 右下半宽
7. `P7` 底部全宽

## Style

- style_key: `bw_lianhuanhua_sketch`
- text_policy: `image_without_text + mobile_frame_text_blocks`

整页风格提示：

黑白小人书 / 连环画式速写插图。线条干净有力，人物动作清楚，故事推进优先于环境装饰。要有“旧小说被讲成人人都能读懂的视觉故事”的感觉。不要唯美花海，不要摆拍英雄照，不要堆砌盔甲纹样，不要把一格画成信息图。

## Character Visual Anchor

**刘备**（`memory/character_visuals.json#liu_bei`）

- 修长偏瘦，白净，耳垂较长，短须
- 气质温和克制，但总能先看懂人
- 早期衣着朴素，不可帝王化

**关羽**（`memory/character_visuals.json#guan_yu`）

- 极高大，长髯垂胸，面色暗红，丹凤眼，卧蚕眉
- 沉静寡言，不怒自威
- 第一次登场必须一眼能记住

**张飞**（`memory/character_visuals.json#zhang_fei`）

- 高壮厚实，黑脸浓须，豹眼，重心前倾
- 热气最重，爆发力最强
- 结义的提议者，不能只当陪衬

## Panels

### Panel 1

- panel_id: `p1`
- scene_id: `cp001_p03_s1`
- story_function: `reveal`
- moment: `关羽推着独轮车到村店门口，急着喝酒后进城投军。刘备正举杯，忽然停住，起身看他。张飞也被这个来人吸住。`
- camera: `中景，门口斜切入画，关羽从门外压进来，刘备和张飞在店内形成迎接视线。`
- why_this_panel_exists:
  - 先把“门口的影子”兑现成一个极强的视觉登场
  - 让没背景知识的读者立刻知道：这是第三个核心人物
  - 用动作和视线建立“识人”的第一瞬间

### Panel 2

- panel_id: `p2`
- scene_id: `cp001_p03_s1`
- story_function: `alliance`
- moment: `三人在桌边坐定。关羽只用几句交代来历：河东人，杀过豪强，逃亡多年，如今来投军。刘备说出讨贼安民的志向，张飞前倾听着。三人已经认出彼此是一路人。`
- camera: `店内三角构图中景，关羽稳坐压场，刘备偏前引导，张飞身体前倾。`
- why_this_panel_exists:
  - 补足关羽不只是“长得威风”，而是带着命案和选择而来
  - 交代三人结义前的精神基础
  - 把“陌生人”推进成“可以同行的人”

### Panel 3

- panel_id: `p3`
- scene_id: `cp001_p03_s2`
- story_function: `proposal`
- moment: `张飞把两人带到庄后桃园。桃花正盛。他罕见地收起笑，郑重提议：就在这里祭告天地，结为兄弟。刘备和关羽都认真听着。`
- camera: `中景偏广，三人立于桃园中心，张飞在动作上最主动，刘备和关羽形成沉稳回应。`
- why_this_panel_exists:
  - 让张飞成为这一段的发动者
  - 把“桃园”从背景变成叙事动作发生地
  - 让结义不是凭空跳到誓言，而是先有提议与决心

### Panel 4

- panel_id: `p4`
- scene_id: `cp001_p03_s2`
- story_function: `core_oath`
- moment: `次日，香案前，乌牛白马祭礼已备。三人在桃花下焚香跪拜。刘备居中，关羽沉稳，张飞最有热气。兄弟名分与誓言同时落定。`
- camera: `中远景正面构图，稳定庄重，香案和三人关系清楚。`
- why_this_panel_exists:
  - 这是全页情感中心，必须单独占一格全宽
  - 让读者看清“庄重”而不是“热闹”
  - 让结义内容可被 captions 清楚承接

### Panel 5

- panel_id: `p5`
- scene_id: `cp001_p03_s3`
- story_function: `turn`
- moment: `结义之后，三人刚发现自己没有马、没有钱铁，庄外就来了折返的北方马商。马群压到庄前，困境突然有了出口。`
- camera: `庄院门口斜向中景，前景是三兄弟回身相迎，后方是一串马匹和两位客商。`
- why_this_panel_exists:
  - 明确展示“现实困难”是什么
  - 把商人赠礼拍成命运转折，而不是流程说明
  - 让读者知道三兄弟不是凭空成军

### Panel 6

- panel_id: `p6`
- scene_id: `cp001_p03_s3`
- story_function: `momentum`
- moment: `有了马和铁，三兄弟各持兵器，披甲立在新聚起的乡勇前。刘备双股剑，关羽青龙刀，张飞丈八矛。人马已经像一支队伍。`
- camera: `横向中景偏广，三兄弟居前，背后是整装乡勇和马匹，动势向前。`
- why_this_panel_exists:
  - 把“礼物”落成真正的军事形态变化
  - 让三件标志兵器第一次明确同框
  - 告诉读者：他们不只是结义了，他们已经成军

### Panel 7

- panel_id: `p7`
- scene_id: `cp001_p03_s3`
- story_function: `closure`
- moment: `三兄弟带着乡勇来到幽州官署前。白发的刘焉从台阶上走下，拍着刘备的肩，把这个布衣认作宗亲。关羽和张飞立在后方，队伍刚踏进官府世界。`
- camera: `中远景收束镜头，官署台阶居中，刘焉与刘备形成前景动作，关羽张飞和乡勇在后方压住局面。`
- why_this_panel_exists:
  - 收住“从桃园到官府”的大推进
  - 让 passage 结尾的制度入口可被看见
  - 给下一段留下“兄弟已上路，但身份问题还在”的余味
