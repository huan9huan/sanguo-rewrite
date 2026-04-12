# AGENTS.md

## Project Goal
Rewrite *Romance of the Three Kingdoms* for foreign general readers.

Primary experience:
- enjoyable story
- strong character attachment
- low cultural barrier
- simple Chinese source draft
- English version rewritten from approved Chinese draft

## Story Rules
- Story first, not culture lecture first
- Culture should be implicit unless a tiny clarification is necessary
- Liu Bei / Guan Yu / Zhang Fei are the core viewpoint anchors
- Character consistency matters more than historical over-explanation

## Production Rules
- Never generate a long draft without a PassageSpec
- Never generate a PassageSpec without a ChapterSpec
- Never translate before CN draft is reviewed
- English adaptation must start from `current/approved_cn.md`, not from draft CN
- English prose and English comic frame text must follow `docs/13_en-style-guide.md`

## Writing Style Rules
- Use simple Chinese
- Prefer short sentences
- Show through action and dialogue
- Avoid long exposition
- End passages with a hook or a meaningful emotional closure

## Passage Rules
Each passage should contain:
- one micro-goal
- one tension/conflict
- one turn or advance
- one hook or closure

Each passage usually contains 2-4 scenes.

## Role System

This content AI system is organized by role position, not by ad hoc file tasks.

There are 4 core role layers:
- Planning: defines the story contract
- Production: turns the contract into reader-facing assets
- Gatekeeping / Canon: decides what is good enough to pass forward and what becomes long-term truth
- IT Support / Operations: moves assets between workspaces and current website handoff surfaces

There is also 1 downstream layer:
- Adaptation: derives new reading forms from approved current assets, such as other languages

Core rule:
- Planning roles define structure
- Production roles implement structure
- Gatekeepers judge readiness
- IT support roles operate the pipeline surfaces but do not redefine content contracts
- Adaptation roles consume approved assets and must not rewrite upstream contracts

## Role Registry

Use this as the primary role index.
Detailed execution rules live in the role files under `agents/`.

### Planning
- Chapter Planner
  中文常用名: `章节策划`
  Position: source chapter -> source passage splits + chapter spec
  Owns: chapter decomposition, chapter arc, passage count
  File: `agents/build-chapter-bundle.md`
- Passage Planner
  中文常用名: `段落策划`
  Position: source passage + chapter spec -> passage spec + scene specs
  Owns: passage goal, conflict, turn, hook, scene structure, list title, one-line catchup
  File: `agents/build-passage-bundle.md`

### Production
- Dramatist
  中文常用名: `正文写手`
  Position: planning contract -> CN draft
  Owns: scene-to-prose, readability, story drive, emotional landing
  File: `agents/writer.md`
- Story Reviser
  中文常用名: `正文改稿`
  Position: review feedback -> next CN draft version
  Owns: targeted repair without breaking valid structure
  File: `agents/editor.md`
- Comic Adapter
  中文常用名: `漫画改编`
  Position: current readable text -> comic run assets
  Owns: frame semantics, prompt package, comic reading contract
  File: `agents/build-comic-prompt.md`
- Reading Integrator
  中文常用名: `阅读编排`
  Position: current text + current comic -> inline reading flow
  Owns: frame insertion points and text/comic composition
  File: `agents/comic-passage-alignment.md`

### Gatekeeping / Canon
- Story Reviewer
  中文常用名: `正文审稿`
  Position: current CN draft -> review decision
  Owns: clarity, story drive, character consistency, translation readiness
  File: `agents/critic.md`
- Comic QA
  中文常用名: `漫画质检`
  Position: current comic run -> product usability judgment
  Owns: comic readiness, panel usability, image fidelity, regenerate judgment
  File: `agents/comic_image_evaluator.md`
- Character Visual Keeper
  中文常用名: `角色定妆`
  Position: pre-comic passage check -> character visual canon
  Owns: core character first-appearance visual anchors before comic adaptation
  File: `agents/character-visual-keeper.md`
- Canon Keeper
  中文常用名: `设定维护`
  Position: stable current text -> long-term memory
  Owns: story canon, character canon, world state canon
  File: `agents/memory_keeper.md`

### IT Support / Operations
- Workspace Operator
  中文常用名: `工作区运维`
  Position: draft/comic workspaces -> validated current assets
  Owns: workspace hygiene, image normalization, panel detection, layout merge, promote flow, current handoff correctness
  File: `pipeline/manage_passage_workspace.py`
  Supporting file: `pipeline/update_comic_page.py`
- Release Operator
  中文常用名: `发布运维`
  Position: current assets -> website-ready exported content -> remote content sync -> site deploy
  Owns: content export, asset normalization, web-facing package generation, GCS sync, deployment handoff
  File: `site/scripts/export-content.mjs`
  Supporting commands: `npm run content:export`, `npm run build`, `gsutil -m rsync`, `npm run deploy`

### Adaptation
- Language Adapter
  中文常用名: `外语改写`
  Position: approved CN + current comic text + canonical metadata -> target-language reading edition and locale overlays
  Owns: downstream language rewrite, English prose draft, English comic frame text adaptation, project/book/chapter metadata localization, style-guide self-check
  File: `agents/translator.md`
  Required guide for English: `docs/13_en-style-guide.md`

## Common Task Routing

Use these examples to locate the right role quickly.

- “把这一回拆成几个 passage” -> `章节策划` / Chapter Planner
- “给这个 passage 生成 spec 和 scene spec” -> `段落策划` / Passage Planner
- “这个 passage 的标题和列表 catchup 太弱，改短一点” -> `段落策划` / Passage Planner
- “根据 spec 写一版中文正文” -> `正文写手` / Dramatist
- “审一下这版正文能不能过” -> `正文审稿` / Story Reviewer
- “按 review 改一版正文” -> `正文改稿` / Story Reviser
- “更新这段之后的记忆和人物状态” -> `设定维护` / Canon Keeper
- “漫画前看看有没有新核心人物要定妆” -> `角色定妆` / Character Visual Keeper
- “把这个 passage 改编成小人书 prompt” -> `漫画改编` / Comic Adapter
- “开始漫画改编” -> `漫画改编` / Comic Adapter
- “漫画质检这张图能不能用” -> `漫画质检` / Comic QA
- “把 comic frame 插进正文阅读流” -> `阅读编排` / Reading Integrator
- “promote 这个 draft / comic 到 current” -> `工作区运维` / Workspace Operator
- “JPG 转 PNG，然后作为 current/comic.png” -> `工作区运维` / Workspace Operator
- "Comic文件已产生，帮我promote"  -> `工作区运维` / Workspace Operator
- “重新 detect box 并 merge comic.json” -> `工作区运维` / Workspace Operator
- “导出网站 content / 让 website 读到 current” -> `发布运维` / Release Operator
- “本地测好了，同步到 GCS 然后部署” -> `发布运维` / Release Operator
- “基于中文定稿改写英文/日文/韩文” -> `外语改写` / Language Adapter
- “把 approved CN 改写成英文正文” -> `外语改写` / Language Adapter, Prose Mode, must follow `docs/13_en-style-guide.md`
- “把漫画旁白/对白改成英文” -> `外语改写` / Language Adapter, Comic Text Mode, must follow `docs/13_en-style-guide.md`
- “生成 books.en.json / cp001.en.json 元数据文案” -> `外语改写` / Language Adapter, Metadata Mode, must follow `docs/13_en-style-guide.md`
- “把项目/书籍/章节元数据本地化成英文 overlay” -> `外语改写` / Language Adapter, Metadata Mode
- “检查英文正文和 comic text 是否符合风格指南” -> `外语改写` / Language Adapter self-check, using `docs/13_en-style-guide.md`
- “promote 英文 draft 到 current/approved_en.md” -> `工作区运维` / Workspace Operator

## Review Gates
A CN draft should be reviewed for:
- clarity
- story drive
- character consistency
- show-not-tell quality
- translation readiness

## Gate Order
- Chapter Planner must finish before Passage Planner
- Passage Planner must finish before Dramatist
- Dramatist must finish before Story Reviewer
- Story Reviewer must finish before Story Reviser or approval
- Approved current CN is the input to Comic Adapter, Canon Keeper, and Language Adapter
- Language Adapter must read `docs/13_en-style-guide.md` before English prose, English comic text, or English metadata work
- Language Adapter Prose Mode and Comic Text Mode must stop if `current/approved_cn.md` is missing
- Language Adapter Metadata Mode may run from canonical metadata files and does not require passage `current/approved_cn.md`
- Metadata Mode outputs locale overlay files such as `story/books.en.json` and `story/cp001.en.json`; it must not add English fields to `story/books.json` or `story/cpNNN.json`
- English comic frame text is adapted per frame and must not be mechanically extracted from English prose
- Character Visual Keeper must run before Comic Adapter when a passage may introduce a new core character
- Comic Adapter must not invent visuals for core characters missing from `memory/character_visuals.json`
- Reading Integrator works on current assets only
- Workspace Operator is responsible for promote into `current/`
- Workspace Operator owns language promote from reviewed language drafts into `current/`
- Release Operator is responsible for local export/build validation, GCS content sync, and site deploy
- Website consumes current assets only

## Workspace Operator Promote Rules

Workspace Operator is an operations role, not a content author.
It must not rewrite prose, change planning specs, or reinterpret comic semantics.

Draft promote:
- Input: `story/chNNN-pNN/draft/vNNN/`
- Required files: `draft_cn.md`, review if available, approved text if available
- Output: `current/draft_cn.md`, `current/draft_cn_review.json`, `current/approved_cn.md` when approved
- Command: `python3 -m pipeline.manage_passage_workspace promote-draft <passage> <draft-version-dir>`

Language promote:
- Input: `story/chNNN-pNN/draft/<lang>/vNNN/`
- Required prose file for English: `draft_en.md`
- Required readiness evidence: `self_check.md` or review notes showing the language draft is approved
- Required source gate: `story/chNNN-pNN/current/approved_cn.md` must exist
- Output for English prose: `current/approved_en.md`
- Optional comic text input for English: `comic_text_en.json`
- Optional comic text output for English: `current/comic_text_en.json`
- Workspace Operator must not rewrite prose, translate text, edit comic semantics, or change frame ids during language promote
- Language promote must preserve existing `current/approved_cn.md`, `current/comic.png`, `current/comic.json`, and Chinese comic text
- English comic text must not be embedded into `current/comic.json` as `title_en` or English `items`
- Content export is responsible for merging `current/comic.json` with `current/comic_text_en.json` into localized website payloads

Comic promote has two phases.

Phase 1: prepare the run before promote.
- Input: selected `story/chNNN-pNN/comic/runNNN/`
- Required image: `comic.png` or an image that can be normalized into `comic.png`
- Required layout source: a base or existing comic layout for the run
- Required operation: normalize image with ImageMagick, detect panel boxes, merge boxes into final `comic.json`
- Command: `python3 -m pipeline.update_comic_page refresh-boxes <passage> --run <comic-run-dir>`

Phase 2: promote validated assets into `current/`.
- Required files after Phase 1: `comic.png`, `comic.json`
- Output: `current/comic.png`, `current/comic.json`
- Command: `python3 -m pipeline.manage_passage_workspace promote-comic <passage> <comic-run-dir>`

Comic promote must check:
- `comic.png` is web-safe normalized PNG
- JPG/JPEG/WebP inputs are converted to PNG by ImageMagick, never copied as-is into `current/comic.png`
- `comic_panel_boxes.json` exists in the selected run
- `comic.json` exists in the selected run
- `comic.json` frames have reasonable `panel_box` values
- known layout patterns, such as `top-wide / middle-two / bottom-wide`, still match their expected geometry
- `current/comic.png` and `current/comic.json` are both updated together

If panel detection looks wrong:
- do not promote blindly
- rerun `refresh-boxes`
- inspect `comic_panel_boxes_debug.png`
- if the detected boxes are still wrong, fix detection or fall back to the trusted base layout before promote

## Safety for Context
Do not feed the whole book into one prompt.
Use only:
- current ChapterSpec
- current PassageSpec
- current SceneSpec(s)
- relevant character memory
- relevant character visual memory before comic adaptation
- recent passage summary
- style rules
