# Passage Comic Pipeline

这条链的目标不是“单张插画”，而是把一个 `passage` 变成一页可排字、可多语言覆盖的连环画页面。

## 从 0 到 1 的分层

### 1. Story Assets

来自现有写作系统：

- `story/<passage>/spec.json`
- `story/<passage>/sNN-spec.json`
- `memory/character_visuals.json`

这些文件回答的是：

- 这一段要讲什么
- 哪几个 scene 是核心
- 人物长什么样

### 2. Passage Comic Spec

新加的一层：

- `passage_comic_spec_vN.md`
- `passage_comic_spec_vN.json`

这层回答的是：

- 这一页连环画到底讲哪几个镜头
- 一页分几格
- 每格的“故事功能”是什么
- 每格真正该画哪个瞬间
- 每格下面未来要承载哪几条文字

### 3. Layout-Friendly Comic Prompt

从 `passage comic spec` 再得到：

- 整页 prompt 或 frame prompts
- 不出字的规则
- 适合 frame image 的画面指令

这层回答的是：

- 模型怎么画这一页
- 画风怎么锁
- 每格图像怎样尽量独立可读

### 4. Text Layout

最后单独输出：

- `comic_reader_layout_vN.json`

这层回答的是：

- 每个 frame 对应哪张图
- 每个 frame 下方显示什么文字
- 前端怎样用固定 mobile layout 渲染

## 推荐生产顺序

1. PassageSpec 锁定
2. SceneSpec 锁定
3. PassageComicSpec 产出
4. 生成无字 frame images 或无字 comic page
5. 产出 `comic_reader_layout_vN.json`
6. WebView 按 `frame -> text` 竖向渲染

## 为什么 PassageComicSpec 是必要的

如果没有这一层，系统会在两个极端之间来回摇摆：

- 要么直接从 scene prompt 生成单张图，缺少整页叙事
- 要么把很多 scene 直接塞进一页 prompt，结构不稳

`PassageComicSpec` 的作用就是把“写作结构”转换成“连环画页面结构”。

## P03 示例

当前样板文件：

- `story/cp001-p03/passage_comic_spec_v1.md`
- `story/cp001-p03/passage_comic_spec_v1.json`
- `story/cp001-p03/comic_reader_layout_v2.json`
