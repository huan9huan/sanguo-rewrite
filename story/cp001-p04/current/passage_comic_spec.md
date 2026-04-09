# Passage Comic Spec

## Meta

- chapter: `cp001`
- passage: `p04`
- page_id: `cp001-p04-page-01`
- title: `初试锋芒`

## Comic Goal

把 `cp001-p04` 改写成一页五格连环画，让读者在一页内读清三件事：

1. 五百对五万——三兄弟第一仗，快刀斩乱麻，张飞关羽一矛一刀干净解决
2. 刘备不只是有志向——他会用脑子打仗，分兵埋伏破青州
3. 投奔恩师卢植——从小仗走向大舞台，但更大的战事还在前面

这一页的重点是战斗节奏和刘备"从勇将变智将"的转变。

## Adaptation Rules

- 一格只讲一个清楚的动作瞬间
- 第一格"五百对五万"立住兵力悬殊的压力
- 第二格"一矛一刀"是全页最快的一格——不许拖
- 第三格"油灯下画线"是全页最安静的一格——节奏要收住
- 第四格"三路夹攻"是战术执行，画面要有方向感和冲击力
- 所有文字放在 frame 下方的文字区，不放在图里
- 采用黑白小人书 / 连环画式速写插图
- 战斗场面要干脆，不是武打回合制

## Page Format

- panel_count: `5`
- reading_direction: `ltr`
- layout_pattern: `top-wide / upper-two / lower-two / bottom-wide`

## Style

- style_key: `bw_lianhuanhua_sketch`
- text_policy: `image_without_text + mobile_frame_text_blocks`

整页风格提示：

黑白小人书 / 连环画式速写插图。这一页是战场，线条要有杀气和速度感。战斗格用动态构图和斜线，战术格用安静的俯视或中景。人物动作必须干脆——一矛一刀就解决。人物大于环境，动作大于细节。不要彩绘，不要海报感，不要摆拍。

## Panels

### Panel 1

- panel_id: `p1`
- scene_id: `cp001_p04_s1`
- story_function: `setup`
- moment: `大兴山下两军对阵——五百人面对五万黄巾的乌压压人海`
- camera: `远景，俯瞰两军对比，凸显人数悬殊`
- must_show:
  - 五百人的小队
  - 乌压压的黄巾人海
  - 刘备骑马居中，关张分列两侧
  - 黄巾军披发、黄巾抹额
- must_avoid:
  - 把对面画成正规军
  - 让五百人显得毫无气势
  - 写回合制武打

### Panel 2

- panel_id: `p2`
- scene_id: `cp001_p04_s1`
- story_function: `pressure`
- moment: `一矛一刀——张飞刺邓茂、关羽斩程远志，两个瞬间叠在一个画面`
- camera: `动态中景，斜线构图，矛和刀的运动轨迹`
- must_show:
  - 张飞丈八矛刺中邓茂胸口
  - 关羽青龙偃月刀劈落
  - 快、狠、干净的杀伤感
- must_avoid:
  - 回合制武打
  - 血腥过度的细节
  - 给邓茂程远志加戏

### Panel 3

- panel_id: `p3`
- scene_id: `cp001_p04_s2`
- story_function: `turn`
- moment: `油灯下，刘备用手指在地图上画了两条线——分兵计策`
- camera: `俯拍中景，帐篷内，油灯照亮地图和刘备的手`
- must_show:
  - 刘备盯着地图
  - 手指画的线
  - 油灯的光
  - 关羽张飞在旁边安静等着
- must_avoid:
  - 把计策画得太复杂
  - 让关张质疑刘备
  - 帐篷里塞满道具

### Panel 4

- panel_id: `p4`
- scene_id: `cp001_p04_s2`
- story_function: `bond`
- moment: `三路夹攻——鸣金为号，关张从两侧杀出，刘备回身再战`
- camera: `远景俯瞰，三路人马从三个方向同时压向中央`
- must_show:
  - 三路人马的方向感
  - 关羽从左、张飞从右、刘备正面
  - 贼军被围的崩溃感
- must_avoid:
  - 重复第二格的杀敌细节
  - 画面太乱看不清方向
  - 展开龚景出城的细节

### Panel 5

- panel_id: `p5`
- scene_id: `cp001_p04_s3`
- story_function: `hook`
- moment: `卢植军帐——师徒重逢，"来了就好"`
- camera: `中景，卢植拍刘备肩膀，关张立于身后`
- must_show:
  - 卢植须发半白、身形挺拔
  - 刘备被拍肩的瞬间
  - 关羽张飞立在刘备身后
- must_avoid:
  - 展开师徒重逢的情感戏
  - 让卢植话多
  - 铺开广宗战场的军事部署

## Output Pairing

本 spec 对应：

- frame-level prompts
- `comic_reader_layout_v1.json`
- generated page prompt
