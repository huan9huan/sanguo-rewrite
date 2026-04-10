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
- Do not edit published files in place; create a new version or explicit revision

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

There are 3 core role layers:
- Planning: defines the story contract
- Production: turns the contract into reader-facing assets
- Gatekeeping / Canon: decides what is good enough to pass forward and what becomes long-term truth

There is also 1 downstream layer:
- Adaptation: derives new reading forms from approved current assets, such as other languages

Core rule:
- Planning roles define structure
- Production roles implement structure
- Gatekeepers judge readiness
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
  Owns: passage goal, conflict, turn, hook, scene structure
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
- Canon Keeper
  中文常用名: `设定维护`
  Position: stable current text -> long-term memory
  Owns: story canon, character canon, world state canon
  File: `agents/memory_keeper.md`

### Adaptation
- Language Adapter
  中文常用名: `外语改写`
  Position: approved CN -> target-language reading edition
  Owns: downstream language rewrite
  File: `agents/translator.md`

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
- Reading Integrator works on current assets only
- Website consumes current assets only

## File Ownership
- `story/chNNN.json`: Chapter Planner output
- `story/chNNN-pNN/spec.json`: Passage Planner output
- `story/chNNN-pNN/sNN-spec.json`: Passage Planner output
- `story/chNNN-pNN/passage.md`: human-facing passage summary / entry file
- `story/chNNN-pNN/draft/vNNN/draft_cn.md`: Dramatist output
- `story/chNNN-pNN/draft/vNNN/draft_cn_review.json`: Story Reviewer output
- `story/chNNN-pNN/draft/vNNN/approved_cn.md`: approved CN readable output
- `story/chNNN-pNN/comic/runNNN/`: comic run assets for one attempt
- `story/chNNN-pNN/current/`: current promoted assets consumed by the site
- `story/chNNN-pNN/published/`: frozen published outputs
- `memory/`: runtime memory and consistency files

## Safety for Context
Do not feed the whole book into one prompt.
Use only:
- current ChapterSpec
- current PassageSpec
- current SceneSpec(s)
- relevant character memory
- recent passage summary
- style rules
