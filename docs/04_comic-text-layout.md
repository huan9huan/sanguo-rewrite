# 连环画阅读布局建议

当前推荐的不是“把文字盖在画里”，而是移动端友好的：

`frame image`
-> `text block`
-> `next frame image`
-> `next text block`

也就是每一格图下面跟一段文字说明或对白。

## 原则

- 图片完全无字
- 不在图中预留对白框
- 前端固定竖屏阅读结构
- 每个 frame 自带一个独立的 text block
- 多语言只替换 text block 内容，不改图

## 为什么这样更稳

- 不依赖模型生成对白位置
- 不需要在图上找 rect
- 对 mobile layout 最友好
- 图像裁切和文字排版彼此独立

## 数据结构

推荐使用：

- `comic_reader_layout_vN.json`
- `comic_panel_boxes_vN.json`
- `schemas/comic_reader_layout.schema.json`

核心字段：

- `frames[]`
  - 一页里的阅读单元列表

- `image_slot`
  - 对应这一格图像资产

- `text_block`
  - 对应这一格下面的文字区

## 推荐工作流

1. 先从 comic spec 生成 base `comic_reader_layout_vN.json`
2. 再生成整页无字 `image.png`
3. 对 `image.png` 做 panel detection / annotation，产出 `comic_panel_boxes_vN.json`
4. 把 boxes merge 回新的 `comic_reader_layout_vN.json`
5. WebView 竖向渲染 `image -> text -> image -> text`
6. 多语言时只切换 `text_block.items[].text`

说明：

- `comic_reader_layout` 是前端最终阅读合同
- `comic_panel_boxes` 是中间检测结果
- 当前站点读取最新的 `comic_reader_layout_vN.json`

## 当前示例

- `story/cp001-p03/comic_reader_layout_v2.json`
- `schemas/comic_reader_layout.schema.json`
