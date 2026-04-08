# 内容理解系统与插画系统集成说明

## 现状判断

当前仓库已经有两套相邻但还没真正接通的系统：

1. 内容理解系统
   - 资产在 `story/`、`memory/`、`schemas/`
   - 强项是 PassageSpec、SceneSpec、角色记忆、working memory
   - 当前输出偏叙事和编辑，不是直接给画图模型吃的视觉合同

2. 插画系统
   - 资产在 `pipeline/`、`config/models.json`
   - 强项是 prompt builder、多引擎路由、结果落盘
   - 当前默认依赖独立的 `data/scenes.json`、`data/characters.json`、`prompts/template.txt`

所以合并的关键不是再复制更多引擎代码，而是建立一层 adapter，让 `story/` 与 `memory/` 直接产出插画系统需要的 scene / character payload。

## 当前最缺的补充

### 1. 视觉化字段补充

现有 `sNN-spec.json` 足够支撑故事写作，但还不够支撑稳定出图。建议补到每个 scene 至少能稳定得到：

- `location`
- `time`
- `action`
- `mood`
- `shot_type`
- `composition`
- `style_tags`
- `scene_emphasis`

其中前四项可先从现有 spec 自动推断，后四项建议进入明确字段，减少 prompt 漂移。

### 2. 角色视觉圣经补充

现在 `memory/character_memory.json` 已经有很强的文本人格和部分外观信息，但还缺统一的视觉合同。建议给核心角色补一层稳定结构：

- `visual_keywords`
- `face_shape`
- `body_build`
- `hair`
- `beard`
- `costume`
- `color_palette`
- `signature_items`
- `forbidden`

这层可以先从 `character_memory.json` 派生，后续再沉淀成独立 `data/characters.json` 或 `assets/characters/*.json`。

### 3. Prompt 模板资产

当前仓库里还没有插画系统默认依赖的：

- `prompts/template.txt`
- `data/scenes.json`
- `data/characters.json`
- `output/`

如果走“独立资产驱动”路线，需要把这些目录补齐。
如果走“内容系统直连”路线，则只需要保留 `prompts/template.txt`，再由 adapter 动态生成 scenes / characters。

### 4. 生产规则补充

建议把插画生产也纳入 AGENTS 规则和产物约定，例如：

- 不允许对未审过的 CN draft 直接出图
- 默认从 `SceneSpec` 出图，而不是整段 passage
- 每个 scene 可有 `illustration_vN/`
- 候选图、prompt、metadata、review 需要版本化存档

### 5. 审核闭环补充

现在有占位评分器，但还缺“图和故事是否对齐”的 review 合同。建议增加：

- `story_readability`
- `character_consistency`
- `scene_match`
- `style_consistency`
- `needs_regen_reason`

这样插画系统才能真正接进现有 review gate，而不是变成旁路。

## 建议的集成路径

### Phase 1: 先接通，不求完美

- 从 `story/<chapter>-<passage>/spec.json` 和 `sNN-spec.json` 直接生成插画 scene payload
- 从 `memory/character_memory.json` 直接生成 character payload
- 复用 `pipeline/builder.py` 和多引擎 adapter
- 先做到“每个 scene 能自动生成 1 到 3 张候选图”

### Phase 2: 稳定一致性

- 为刘备、关羽、张飞、曹操建立明确视觉锚点
- 给 scene spec 增加镜头、构图、昼夜、画风标签
- 引入角色参考图索引

### Phase 3: 接入站点与审核

- Creator 页增加 scene illustration 面板
- 展示 prompt、候选图、metadata、评分结果
- 允许人工挑图并标记 approved asset

## 已补的桥接层

仓库里已新增：

- `pipeline/story_adapter.py`

它会把：

- `story/cpNNN-pNN/spec.json`
- `story/cpNNN-pNN/sNN-spec.json`
- `memory/character_memory.json`

转换成插画系统可消费的 passage bundle，作为第一版接线层。

## 我建议你优先补的内容

如果你现在想最小成本把系统跑起来，优先顺序是：

1. 补 `prompts/template.txt`
2. 确认核心角色视觉锚点字段
3. 决定 scene 级出图还是 passage 级出图
4. 决定插画产物存放路径和版本规则
5. 再接站点展示和人工 review

## 一个重要判断

这次合并里，最值得保留的是“内容理解结果驱动插画”，不是旧项目里那套独立 `scenes.json` 手工维护方式本身。

也就是说：

- 多引擎生成链路值得并入
- prompt builder 值得并入
- metadata / output 体系值得并入
- 但 scene / character 数据源最好改成从当前仓库的 story + memory 直接派生

这样两套系统才是真的合并，而不是并排共存。
