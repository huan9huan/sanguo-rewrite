# Podcast Workflow

## Goal

Podcast is a downstream audio-first product line for approved passage assets.

It turns a stable passage into a short two-host story episode for foreign general listeners:

```text
narrator: guides the story
listener: represents a smart beginner hearing Three Kingdoms for the first time
```

This is not a replacement for the approved prose.
It is a companion listening edition.
Video, when needed, is derived from the podcast run.
The podcast remains the primary product.

## Product Position

Default product shape:

- English-first
- 1.5-3 minutes per passage
- two-host story podcast
- cinematic but clear
- TTS-friendly
- optionally synced to current comic frames

Use the term:

```text
two-host story podcast
```

Avoid calling it a pure audiobook unless the user requests straight narration.

## Source Gate

Required source for every run:

- `story/<passage>/current/approved_cn.md`

For English:

- prefer `story/<passage>/current/approved_en.md`
- follow `docs/13_en-style-guide.md`

For comic sync:

- use `story/<passage>/current/comic.json`
- optionally use `story/<passage>/current/comic_alignment.json`

Do not use draft text by default.
Do not infer missing story facts from memory alone.
Do not rewrite upstream approved prose.

## Roles

Podcast production is split by responsibility. Do not route every task to Podcast Episode Builder.

- `agents/build-podcast-episode.md`
- `agents/podcast-audio-operator.md`
- `agents/build-podcast-video.md`
- `agents/podcast-video-copy-evaluator.md`

Role names:

- English: `Podcast Episode Builder`
- 中文常用名: `播客有声故事`
- English: `Podcast Audio Operator`
- 中文常用名: `播客音频运维`
- English: `Podcast Video Builder`
- 中文常用名: `播客视频`
- English: `Podcast Video Copy Evaluator`
- 中文常用名: `播客视频文案评估`

Positions:

```text
approved current assets -> reviewed two-host podcast episode script
reviewed podcast episode JSON -> TTS audio + timeline + subtitles + audio manifest
podcast audio timeline + current comic assets -> podcast-driven vertical motion comic video package
```

Evaluation position:

```text
podcast/video script + metadata -> cross-cultural clarity review
```

## Directory Layout

Podcast runs live beside `draft/`, `comic/`, `video/`, and `current/`:

```text
story/<passage>/
  podcast/
    run001/
      source_manifest.json
      episode_en.json
      script_en.md
      self_check_en.md
      voice_cast_en.json
      audio_manifest_en.json
      timeline_en.json
      subtitles_en.json
      audio_lines_en/
        p001_l001.mp3
      output/
        episode_en.mp3
      video/
        frames/
        shot_plan_en.json
        storyboard_en.md
        render_plan_en.json
        video_manifest_en.json
        upload_metadata_en.md
        output/
          podcast_motion_en.mp4
          cover_en.png
```

If a run is script-only, it may omit audio files and timeline files.

## MVP Output

The first practical version should produce:

- `source_manifest.json`
- `episode_en.json`
- `script_en.md`
- `self_check_en.md`

Audio is produced by `Podcast Audio Operator`, not by an ad hoc script inside the run directory.

## Episode JSON

Use:

- `schemas/podcast_episode.schema.json`

`episode_<lang>.json` is the source of truth for podcast script content.
`script_<lang>.md` is a review view derived from JSON, not a second editable source.

Required top-level fields:

- `episode_id`
- `source_passage`
- `language`
- `mode`
- `title`
- `target_audience`
- `tone`
- `voices`
- `source`
- `lines`
- `quality_checks`

Line-level fields:

- `id`
- `speaker`
- `text`
- `function`
- `delivery`
- `pause_after_ms`
- optional `tts_text`, only when the TTS engine needs a pronunciation-safe variant of `text`
- optional `frame_id`
- optional `visual_anchor`
- optional `pronunciation_note`

`frame_id` is optional because podcast pacing should not be forced into a frame cut on every line.

### Strict Script Format

Each spoken line is one JSON object. The Markdown script must be generated from the same line order and may not introduce extra spoken text.

Required line contract:

```json
{
  "id": "cp001_p01_en_l001",
  "speaker": "narrator",
  "text": "Empires rarely break all at once.",
  "function": "hook",
  "delivery": "quiet, image-first",
  "pause_after_ms": 220,
  "frame_id": "f1",
  "visual_anchor": "advance_frame"
}
```

Speaker constraints:

- `narrator` carries story movement, action, stakes, and emotional landing.
- `listener` asks beginner-facing clarification questions or short tracking responses.
- `listener` must not take over exposition.
- `narrator` should normally hold 65-75% of lines.
- `listener` should normally hold 25-35% of lines.

Text constraints:

- one spoken line contains one beat
- avoid multi-clause explanation blocks
- keep long English lines under about 28 words unless the line is intentionally a flowing narration beat
- do not put stage directions inside `text`
- use `delivery` for performance notes
- use `pronunciation_note` or `tts_text` for pronunciation support

Markdown `script_<lang>.md` format:

```text
# <Episode Title>

| id | speaker | function | frame | pause | text |
| --- | --- | --- | --- | ---: | --- |
| cp001_p01_en_l001 | narrator | hook | f1 | 220 | Empires rarely break all at once. |
```

Free-form script prose below the table is not allowed unless it is clearly under a non-spoken `Notes` heading.

Preferred export command:

```bash
python3 -m pipeline.export_podcast_script \
  --run story/<passage>/podcast/runNNN \
  --lang en
```

### `f0` / `0帧`

`f0` is the opening clue frame, 中文可称 `0帧`.

It is a virtual frame before the first comic frame.
It gives the listener/viewer enough context to understand what the episode or passage is about.

Typical contents:

- book title
- chapter title
- passage title
- current full comic image or selected current comic visual
- one short setup line, such as `上一集说到...` or, for P01, `故事从这里开始`

Rules:

- `f0` is not part of `current/comic.json`.
- `f0` must not renumber or replace `f1`.
- `f0` can be referenced in podcast/video planning as `frame_id: "f0"` when the line belongs to the opening card.
- Renderers should resolve `f0` from an opening-card asset, not from comic panel detection.
- `f0` should end with a short pause before the narrator enters the story on `f1`.
- `f0` is for orientation and curiosity, not summary-heavy explanation or spoilers.

## Mode Values

Use one of:

- `two_host_story_podcast`
- `single_narrator`
- `comic_synced_podcast`

Default:

```text
two_host_story_podcast
```

Use `comic_synced_podcast` only when the run intentionally powers frame highlight or visual follow-along.

## Voice Defaults

Shared Google TTS guidance lives in:

- `docs/14_comic-video-tts-guide.md`

Initial English defaults:

```json
{
  "narrator": {
    "voice": "en-US-Chirp3-HD-Kore",
    "rate": 1.08
  },
  "listener": {
    "voice": "en-US-Chirp3-HD-Iapetus",
    "rate": 1.06
  }
}
```

Initial Chinese defaults:

```json
{
  "narrator": {
    "voice": "cmn-CN-Chirp3-HD-Kore",
    "rate": 1.16
  },
  "listener": {
    "voice": "cmn-CN-Chirp3-HD-Iapetus",
    "rate": 1.12
  }
}
```

Current production preference:

- female narrator
- male listener
- slightly faster than default TTS rate
- short pauses, usually 150-320ms inside the episode
- final hook pause can be longer, around 450ms

Avoid very slow rates such as `0.94` for Chinese podcast output unless the user wants a ceremonial or solemn reading.
Slow rate plus repeated 600-900ms pauses makes the episode feel like each word is being dropped separately.

Actual voice names must be verified with `tools/list_google_tts_voices.py` before final audio production.

## Audio Production

Audio production has one shared entrypoint:

```bash
python3 -m pipeline.build_podcast_audio \
  --run story/<passage>/podcast/runNNN \
  --lang en
```

The script reads:

- `episode_<lang>.json`
- `voice_cast_<lang>.json` when present, otherwise `episode_<lang>.json` `voices`

The script writes:

- `audio_lines_<lang>/*.mp3`
- `audio_manifest_<lang>.json`
- `timeline_<lang>.json`
- `subtitles_<lang>.json`
- `output/episode_<lang>.mp3`
- `concat_list_<lang>.txt`

Rules:

- do not create `story/<passage>/podcast/runNNN/build_audio.py`
- do not let the audio script rewrite `episode_<lang>.json`
- do not let the audio script rewrite `source_manifest.json`
- regenerate audio with `--force` only when that is intentional
- if the line text is wrong, revise `episode_<lang>.json` through Podcast Episode Builder first

`timeline_<lang>.json` must be based on measured TTS durations from `ffprobe`.
Estimated durations are not acceptable for final video handoff.

## Script Shape

Recommended line count:

- 20-45 lines for 1.5-3 minutes

Recommended balance:

- narrator: 65-75%
- listener: 25-35%

Suggested episode arc:

1. Cold open with an image or action.
2. Listener asks the beginner question.
3. Narrator gives just enough context.
4. Story moves through one clear conflict or turn.
5. Character meaning lands through action.
6. Ending hook or emotional closure.

## Listener As Light Glossary

The listener is the best place to explain unfamiliar cultural or political elements.

Do not add footnotes or lecture blocks in the narrator voice.
Let the listener briefly ask what a term means, then let the narrator answer in one or two plain lines and return to the story.

Good targets for listener clarification:

- court symbols, such as `dragon throne`
- palace roles, such as `eunuchs`
- slogans or religious-political phrases, such as `Blue Heaven` and `Yellow Heaven`
- important locations, such as `Luoyang` or `Youzhou`
- status terms, such as governor, rebel, scholar, or imperial clan

Good pattern:

```text
NARRATOR: It coils on the dragon throne.
LISTENER: The dragon throne means the emperor's seat, right?
NARRATOR: Yes. The seat of the emperor, and the symbol of the empire.
```

Another good pattern:

```text
NARRATOR: The Blue Heaven is dead. The Yellow Heaven rises.
LISTENER: Blue Heaven, Yellow Heaven. Is that a call for a new order?
NARRATOR: Yes. The old world is dead. A new one should replace it.
```

Keep these explanations short.
They should make the next story beat easier to hear, not turn the episode into a history class.

Do not explain every unfamiliar word.
Explain only what the listener needs right now to feel the stakes.

## Video Subtitle Policy

For podcast-driven motion comic video, subtitles should distinguish speakers by color, not by heavy layout changes.

Default:

- Narrator uses white or warm white text.
- Listener uses pale yellow text.
- Keep the same subtitle box position and typography for both speakers.
- Do not use border lines, side bars, or card shape changes to mark speaker role.
- Do not render `Narrator` or `Listener` labels on screen unless explicitly requested.
- Do not add talking-head avatars or podcast host portraits.

The text color distinction is enough to tell the viewer who is speaking while preserving the comic as the visual focus.

### Subtitle Safety Constraints

The render pipeline has hard limits. Lines that exceed them are silently truncated — the overflow text simply disappears from the video.

Current constraints (`pipeline/render_podcast_motion_comic.py`):

- Font: **30px Arial Bold** (Helvetica fallback)
- Canvas width: **1080px** (9:16 Shorts)
- Max lines per subtitle: **3**
- Effective capacity: ~55 characters per line, ~**165 characters total** per subtitle box

**Before any video render, verify every line fits.** Use a diagnostic check:

```python
from PIL import Image, ImageDraw, ImageFont
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 30)
draw = ImageDraw.Draw(Image.new('RGB', (100, 100)))
max_w = 1080 - 70 * 2 - 44  # 896px

def wrap(text):
    words = text.split()
    lines = []
    current = ''
    for word in words:
        candidate = word if not current else f'{current} {word}'
        if draw.textbbox((0, 0), candidate, font=font)[2] <= max_w:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines
```

Any line with `len(wrap(text)) > 3` **will be truncated in the video**.

Fix workflow:

1. Run the diagnostic on `episode_<lang>.json` before TTS.
2. Trim overflowing lines to fit 3 subtitle lines (≤165 chars of normal text).
3. Audio text may be slightly longer than subtitle text — this is acceptable for accessibility subtitles.
4. If trimming is not possible, split the line into two shorter lines (requires TTS regeneration).

This check is also part of the Copy Evaluation Gate (`agents/podcast-video-copy-evaluator.md`).

### Opening Card Subtitle

Lines placed before the first comic frame (typically `frame_id: null` or `f0` lines) render over the opening card.

The render pipeline (`pipeline/render_podcast_motion_comic.py`) draws subtitles on the opening card — it no longer returns the card without text.

Rules:

- Always provide an opening card when the episode has lines that precede the first frame advance.
- The opening card is a 1080×1920 PNG with book/chapter/passage identity and trademark.
- Do not assume the opening card will hide missing subtitles.

## Shorts Safe-Area Layout

Podcast-driven motion comic videos exported for Shorts must account for YouTube and iPhone UI overlays.

Default playback layout:

- reserve the top `20%` of the 9:16 canvas as quiet vertical safe area
- place chapter and passage identity below that safe area
- use a global passage id in the header, such as `c1/p1`
- show a horizontal filmstrip under the header
- keep the active frame normal / highlighted and the inactive frames grayscale or dimmed
- show the current comic frame in the middle as the main visual
- place subtitles below the main frame, inside a stable bottom safe area

Avoid:

- title text near the top edge, because YouTube Shorts title chrome and iPhone Dynamic Island can cover it
- large accidental blank space below the comic image
- frame-title labels above the main panel when the header already identifies the passage
- speaker labels or border styles for narrator / listener

For `f0`, keep `Built by ReadChineseClassics.com` above the lower platform chrome; do not place the trademark only at the bottom edge.

## Upload Metadata

Every rendered podcast video package should include a Markdown upload metadata file:

```text
story/<passage>/podcast/runNNN/video/upload_metadata_<lang>.md
```

Required fields:

```text
Short Title:
Title:
Description:
Tweet:
```

Use:

- `Short Title` for internal lists, thumbnails, filenames, or short UI labels.
- `Title` for YouTube or public upload title.
- `Description` for upload description.
- `Tweet` for short social post copy.

The description should be post-ready and not mention internal file paths, pipeline mechanics, or draft status.
The tweet should be ready to post and include the required campaign hashtag when one is specified.

### YouTube Shorts Export Copy

When exporting a podcast motion comic video for YouTube Shorts, create:

```text
story/<passage>/podcast/runNNN/video/upload_metadata_<lang>.md
```

The file must be ready to paste into YouTube Studio.

For English Shorts, use this shape:

```text
Short Title:
An Empire Is Breaking

Title:
An Empire Is Breaking | Romance of the Three Kingdoms Ep. 1 #Shorts

Description:
Episode 1 of Romance of the Three Kingdoms, retold as a motion comic for new readers.

An empire is breaking. The court has lost control. A rebellion spreads. At one city gate, a notice goes up.

Built by ReadChineseClassics.com

#RomanceOfTheThreeKingdoms #ThreeKingdoms #ChineseClassics #MotionComic #Shorts

Tweet:
An empire is breaking. A notice goes up at the gate.

Romance of the Three Kingdoms begins as a motion comic for new readers.

#RomanceOfTheThreeKingdoms #MotionComic
```

Tips:

- Make the title a story hook first and a series label second.
- Let the description explain the format in one line, then return to story stakes.
- Keep hashtags useful and limited.
- Match the upload copy to `f0`; the video should visually deliver what the title promises.
- Use the global passage id, such as `c1/p1`, in internal metadata or `f0` if needed, not as the public title.

Pitfalls:

- Avoid titles that only name the passage, such as `Prelude to Chaos`, unless the hook is also present.
- Avoid project-process language, such as `AI rewrite`, `draft`, `pipeline`, or `render test`.
- Avoid long cultural explanations in the description.
- Keep `Built by ReadChineseClassics.com` visible in `f0` above bottom platform chrome, because Shorts UI can cover the lower edge.
- Do not depend on speaker labels in subtitles; use color accents and keep subtitles inside the safe area.

## Copy Evaluation Gate

English podcast/video copy must pass a cross-cultural clarity review before it is considered publish-ready.

Use:

- `agents/podcast-video-copy-evaluator.md`

Output:

```text
story/<passage>/podcast/runNNN/copy_eval_<lang>.md
story/<passage>/podcast/runNNN/video/copy_eval_<lang>.md
```

Audience assumption:

```text
a medium-level foreign listener who does not know Three Kingdoms
```

The evaluator should focus on:

- whether the listener understands what is happening
- whether the listener understands why it matters
- whether unfamiliar terms create avoidable friction
- whether Listener is doing enough light clarification
- whether there are too many pinyin names too close together
- whether YouTube title, description, and tweet work for cold audiences

Decision values:

- `Pass`: ready for TTS/video/upload copy use
- `Revise`: understandable but needs specific fixes
- `Block`: assumes too much cultural knowledge

The evaluator should not rewrite the whole script.
It should give targeted fixes such as:

- add a short Listener question
- add one plain Narrator clarification line
- add light inline context
- remove or delay a nonessential name
- replace academic language with a concrete phrase

## QA Gate

A podcast script is not ready until it passes:

- a foreign beginner can follow it
- the opening has an image
- no lecture-first structure
- no name pileup
- unfamiliar cultural terms are either understandable from context or clarified by the listener
- listener lines are useful and restrained
- line length is TTS-friendly
- no major spoiler is added early
- no unapproved facts are introduced
- ending has a hook or closure
- comic anchors are useful if present
- English podcast/video copy has passed cross-cultural clarity evaluation

Write the result into `self_check_<lang>.md`.

## Relationship To Video

Podcast:

- 1.5-3 minutes
- audio-first
- can be understood without video
- may hold or ignore comic frames

Podcast-driven video:

- secondary to podcast
- uses the podcast audio timeline
- reinforces the episode with current comic frames
- does not create a separate short-video script

Use:

- podcast: `story/<passage>/podcast/runNNN/`
- podcast-driven video: `story/<passage>/podcast/runNNN/video/`

Deprecated:

- standalone motion comic short production under `story/<passage>/video/runNNN/`
- `agents/build-comic-video.md`
- `agents/comic-video-editor.md`
- `agents/comic-video-director.md`
- `agents/comic-video-operator.md`

Do not use the deprecated short-video path for new production unless the user explicitly asks for legacy format exploration.

## Podcast Video Builder

Podcast-driven video has its own entry role:

- `agents/build-podcast-video.md`

Use it when the request is:

- "把 podcast 做成视频"
- "基于播客音频生成竖屏视频"
- "render podcast motion comic"
- "用 podcast run 做 Shorts"

Required command:

```bash
python3 -m pipeline.render_podcast_motion_comic \
  story/<passage> \
  --run story/<passage>/podcast/runNNN \
  --lang en
```

Podcast Video Builder must:

- use `timeline_<lang>.json` and `output/episode_<lang>.mp3`
- keep audio timing as the primary timeline
- use current comic assets only
- write video outputs under `podcast/runNNN/video/`
- create `video/upload_metadata_<lang>.md` as part of the video package — do not skip this step
- create `video/opening_card_<lang>.png` (with matching `.json` metadata) when the episode has lines before the first frame advance
- verify subtitle text fits 3 lines at 30px bold before rendering (see Subtitle Safety Constraints)
- verify the opening card renders subtitles for pre-frame lines

Podcast Video Builder must not:

- edit `episode_<lang>.json`
- rerun TTS
- use `story/<passage>/video/runNNN/`
- create a standalone short-video script
- invent podcast host portraits
- ship a video without `upload_metadata_<lang>.md`

## Future Work

After MVP script runs are stable:

- add frontend playback with line and optional frame sync
- add A/B testing for narrator/listener voice pairs
