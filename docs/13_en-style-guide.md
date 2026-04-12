# English Style Guide — Three Kingdoms Rewrite

This guide defines the English voice for prose reading text and comic frame text. It governs all Chapter 1 English production and applies to future chapters unless superseded.

## 1. Core Principle

**Adaptation, not translation.** The Chinese draft is the structural source — scene order, dramatic beats, and story facts must match — but the English reader experiences a story written for them, not a document that reveals its other-language origins.

## 2. Prose Voice

### 2.1 Tone

Grim, propulsive, cinematic. Think long-form war journalism crossed with historical fiction for adults. Not academic. Not heroic fantasy. Not a children's retelling.

The narrator speaks with the authority of someone who was there and is telling you what happened, matter-of-factly, without commentary or moralizing.

### 2.2 Rhythm

- Short declarative sentences for impact. Long sentences only when momentum demands them.
- One-beat paragraphs for key moments. Let white space do the work.
- Avoid semicolons. Use periods and let the reader connect.

**Chinese pattern (for reference):**
> 烂从宦官起。

**English target:**
> The rot started with the eunuchs.

One short sentence. Full stop. Move on.

### 2.3 Cultural Terms

Handle culture implicitly. The reader learns by context, not explanation.

| Chinese | English treatment |
|---------|-------------------|
| 太监 / 阉党 | eunuchs (no footnote) |
| 中郎将 | general (drop the court rank title) |
| 太守 | governor |
| 议郎 | court official (or just describe the action) |
| 榜文 | notice / recruitment poster |
| 黄巾 | Yellow Turbans (first use: "wrapped yellow cloth around their heads — the Yellow Turbans") |
| 临江仙 | Do not translate the poem. Use a prose evocation: "The river rolls east, washing away heroes..." or similar, attributed as "an old poem." Do not footnote or explain the poetic form. |

**Rule of thumb:** If a term requires a parenthetical or footnote to make sense, rephrase the sentence instead.

### 2.4 Names

Use pinyin for all names. No courtesy names (字) at first mention unless the story requires it.

| Name | Notes |
|------|-------|
| 张角 | Zhang Jiao |
| 刘焉 | Liu Yan |
| 何进 | He Jin |
| 曹节 | Cao Jie |
| 蔡邕 | Cai Yong |

On first mention, give enough context for the reader to place the person. On subsequent mentions, use the name alone.

### 2.5 Things to Avoid

- **"As you know" exposition.** Never have a character explain something the reader can figure out.
- **Historical dates as bullet points.** "In the second year of Jian Ning..." is fine embedded in action. "Jian Ning 2 (169 CE)" is a textbook.
- **Epic fantasy register.** No "behold," "verily," "mighty warrior." This is a grounded retelling.
- **Wikipedia voice.** No passive-aggregate constructions ("It was decided that troops would be sent"). Use active voice with clear agents.
- **Number soup.** "Three hundred thousand troops across eight provinces" is fine once. Don't stack numbers in consecutive sentences.

### 2.6 Opening Poem Treatment

The 临江仙 opens the Chinese text. For English, render it as a short prose evocation that captures the mood (impermanence, passage of time, old men laughing over wine) without attempting to translate the poem line by line. Attribute it as an old poem or song. Keep it to 2-3 sentences max, then cut to the story.

## 3. Comic Frame Text Rules

Comic text is adapted **per frame**, not extracted from the English prose draft.

### 3.1 Frame Titles

- 2-6 English words.
- Evocative, not descriptive. "A Snake on the Throne" not "Emperor Sees Snake."
- Capitalize like a headline.

### 3.2 Captions and Dialogue

- 1-2 short sentences per text block.
- Each frame has one job: setup, action, emotion, turn, or hook. The English text preserves that function, not the exact words.
- Narrator captions use the same voice as prose but compressed.
- Dialogue stays in character and must work visually alongside the image.

### 3.3 Length Guidance

| Element | Max |
|---------|-----|
| Frame title | 6 words |
| Caption block | 2 sentences |
| Speech line | 1 sentence |

### 3.4 No Image Regeneration

Current comic policy keeps text outside the image. English text replaces Chinese text in the overlay. Only flag a frame for image regeneration if the original image contains unremoveable embedded Chinese characters that break the English reading experience.

## 4. Continuity Rules

- Passage N+1 can reference events from Passage N, but each passage must stand on its own as a reading unit.
- Recurring characters keep the same name and voice across passages.
- The emotional arc of the chapter (here: grim → oppressive → urgent) should be readable across the English passages even if the exact beats differ slightly from Chinese.

## 5. Quality Checklist

Before any English passage is promoted to `approved_en.md`, verify:

- [ ] All must_include items from the spec are present in some form
- [ ] No must_avoid violations
- [ ] Cultural terms follow section 2.3 (no footnotes, no parentheticals)
- [ ] Names follow section 2.4 (pinyin, contextualized on first use)
- [ ] Opening poem follows section 2.6
- [ ] Comic frame titles are ≤6 words
- [ ] Comic captions are ≤2 sentences
- [ ] No sentence reads like a translation ("was known as," "is referred to")
- [ ] Active voice dominates; passive is used only when the agent is genuinely unknown or unimportant
- [ ] The passage reads as if it were originally written in English
