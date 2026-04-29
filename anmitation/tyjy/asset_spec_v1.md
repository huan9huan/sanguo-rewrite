# 桃园结义素材方案 v1

目标：为 `anmitation/tyjy/` 这段实验页准备一套一致性更高、可直接用于网页动画/对白的图片素材。

这版不追求一次做满所有镜头，先做一套最小但够用的资产包。

## 1. 素材数量

建议先生成 `8` 张：

1. 背景板 `1` 张
2. 刘备立绘 `2` 张：`idle` / `talk`
3. 关羽立绘 `2` 张：`idle` / `talk`
4. 张飞立绘 `2` 张：`idle` / `talk`
5. 三人结义关键画面 `1` 张

总计：`8` 张

## 2. 文件清单

建议输出为：

- `bg_taoyuan.png`
- `liubei_idle.png`
- `liubei_talk.png`
- `guanyu_idle.png`
- `guanyu_talk.png`
- `zhangfei_idle.png`
- `zhangfei_talk.png`
- `oath_group.png`

## 3. 素材用途

### 背景板

- 文件：`bg_taoyuan.png`
- 用途：整段对白的固定背景
- 要求：
  - 只有桃园环境
  - 不要人物
  - 不要文字
  - 不要前景大遮挡
  - 留出中间区域给角色站位

### 人物立绘

- 文件：
  - `liubei_idle.png`
  - `liubei_talk.png`
  - `guanyu_idle.png`
  - `guanyu_talk.png`
  - `zhangfei_idle.png`
  - `zhangfei_talk.png`
- 用途：
  - 左中右站位立绘
  - 对白时切换 `idle / talk`
- 要求：
  - 全身或接近全身
  - 正面略带三分之四角度
  - 人物完整，不裁头，不裁脚
  - 单色纯净背景
  - 不要地面投影
  - 不要环境雾气
  - 不要复杂背景纹理

### 三人关键画面

- 文件：`oath_group.png`
- 用途：
  - 章节高潮画面
  - 作为过场 cutscene 或中景插图
- 要求：
  - 三人同框
  - 有结义动作和仪式感
  - 不要求抠图
  - 构图完整

## 4. 尺寸建议

- 背景板：`1920x1080`
- 人物立绘：`1024x1536` 或 `896x1344`
- 三人关键画面：`1920x1080`

说明：

- 背景和关键画面统一用横图
- 人物立绘统一用竖图
- 三位角色的立绘比例必须一致

## 5. 一致性规则

这部分最关键。所有图都必须遵守：

1. 同一画风
2. 同一时代服装逻辑
3. 同一光线方向
4. 同一镜头高度
5. 同一人物脸型和年龄感
6. 同一色彩系统

建议风格方向：

- 动画式扁平矢量插画
- 低细节卡通人物
- 几何化角色设计
- 轻量 2D 动画风
- 线条清楚，但不要复杂纹理
- 颜色偏温暖土色，但整体更简洁

## 6. 角色约束

### 刘备

- 气质：仁厚、克制、带一点忧思
- 外形关键词：
  - 汉末草根青年
  - 五官简洁
  - 不贵族
  - 不官气
  - 朴素布衣，有主角感但不是贵公子

### 关羽

- 气质：沉稳、肃静、强自持
- 外形关键词：
  - 长须
  - 眉眼冷静
  - 身形高大
  - 草根出身
  - 衣着朴素，不武将铠甲化

### 张飞

- 气质：刚猛、直接、豪气
- 外形关键词：
  - 体格厚重
  - 胡须粗
  - 神情外放
  - 有冲劲
  - 像民间壮士，不像高级将领

## 7. 生成顺序

建议按这个顺序生成：

1. 先出 `3` 张人物默认立绘：
   - `liubei_idle.png`
   - `guanyu_idle.png`
   - `zhangfei_idle.png`
2. 确认三人脸和服装统一
3. 再基于对应人物生成 `talk` 版本
4. 最后生成：
   - `bg_taoyuan.png`
   - `oath_group.png`

不要一开始同时乱出八张。先把人物统一住。

## 8. Prompt 模板

下面是建议给图像引擎的模板。

### 8.1 全局风格前缀

```text
late Han dynasty, Romance of the Three Kingdoms tone, animation-style flat vector illustration, low-detail cartoon characters, geometric character design, lightweight 2D animation look, unified visual style, warm earthy palette, clean silhouette, readable facial features, no modern elements
```

### 8.2 背景板 prompt

```text
late Han dynasty peach garden at dusk, altar table prepared for an oath ceremony, peach trees, warm ambient glow, open central space for three standing characters, no people, no text, no heavy foreground obstruction, wide environmental background, animation-style flat vector illustration, low-detail cartoon scene, geometric simplified shapes, lightweight 2D animation look, unified visual style, warm earthy palette
```

negative:

```text
people, characters, crowd, text, watermark, logo, blurry details, modern props, fantasy armor, heavy fog, extreme depth of field
```

### 8.3 人物 idle prompt 模板

```text
[角色名], full body character sprite, standing pose, calm neutral expression, late Han dynasty commoner clothing, peasant-rooted look, plain cloth garments, clean silhouette, centered composition, plain solid light background, no cast shadow, no floor shadow, no props blocking the body, readable hands, readable face, animation-style flat vector illustration, low-detail cartoon character, geometric character design, lightweight 2D animation look, unified visual style, warm earthy palette
```

例如刘备：

```text
Liu Bei, full body character sprite, standing pose, calm neutral expression, benevolent and restrained temperament, late Han dynasty commoner clothing, simple cloth garments, grass-roots hero, not aristocratic, not official, not armored, clean silhouette, centered composition, plain solid light background, no cast shadow, no floor shadow, no props blocking the body, readable hands, readable face, animation-style flat vector illustration, low-detail cartoon character, geometric character design, lightweight 2D animation look, unified visual style, warm earthy palette
```

### 8.4 人物 talk prompt 模板

```text
[角色名], full body character sprite, speaking pose, mouth slightly open, one hand slightly raised or gesture of speaking, late Han dynasty commoner clothing, peasant-rooted look, plain cloth garments, clean silhouette, centered composition, plain solid light background, no cast shadow, no floor shadow, no props blocking the body, readable hands, readable face, animation-style flat vector illustration, low-detail cartoon character, geometric character design, lightweight 2D animation look, unified visual style, warm earthy palette
```

注意：

- `talk` 版只改表情和轻动作
- 不要换服装
- 不要换视角
- 不要换光线

### 8.5 三人结义关键画面 prompt

```text
Liu Bei, Guan Yu, and Zhang Fei swearing brotherhood together in a peach garden, oath ceremony altar, incense and wine, solemn emotional atmosphere, three characters clearly visible in one frame, strong sense of brotherhood, late Han dynasty, all three as grass-roots commoner heroes, plain cloth garments, no aristocratic styling, no heavy warrior armor, animation-style flat vector illustration, low-detail cartoon characters, geometric character design, lightweight 2D animation look, unified visual style, warm earthy palette, readable composition
```

negative:

```text
text, watermark, logo, extra characters, chaotic crowd, modern items, fantasy effects, exaggerated action blur, cropped faces, missing limbs
```

## 9. 背景要求

除了背景板和三人关键画面，其余人物立绘都建议：

- 纯净单色背景
- 不要渐变
- 不要投影
- 不要环境色污染

原因：

1. 更容易抠图
2. 边缘更干净
3. 更适合网页贴图
4. 方便后续复用到别的场景

## 10. 后续升级

如果这版可用，下一步再扩展到：

- 每人 `emotion` 版本：平静 / 激昂
- 每人 `action` 版本：拱手 / 举杯 / 宣誓
- 单人近景肖像
- 结义前、结义中、结义后 `3` 张背景板

但 v1 不要先做这么多。
