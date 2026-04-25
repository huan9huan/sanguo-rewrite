# Podcast Workflow

## Goal

Podcast is a downstream audio-first product line for approved passage assets.

It turns a stable passage into a short two-host story episode for foreign general listeners:

```text
narrator: guides the story
listener: represents a smart beginner hearing Three Kingdoms for the first time
```

This is not a replacement for the approved prose.
It is not a motion comic short.
It is a companion listening edition.

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

## Role

Execution entry:

- `agents/build-podcast-episode.md`
- `agents/podcast-video-copy-evaluator.md`

Role name:

- English: `Podcast Episode Builder`
- 中文常用名: `播客有声故事`
- English: `Podcast Video Copy Evaluator`
- 中文常用名: `播客视频文案评估`

Position:

```text
approved current assets -> two-host podcast script + audio-ready episode package
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
      audio_lines/
        p001_l001.mp3
      output/
        episode_en.mp3
```

If a run is script-only, it may omit audio files and timeline files.

## MVP Output

The first practical version should produce:

- `source_manifest.json`
- `episode_en.json`
- `script_en.md`
- `self_check_en.md`

TTS can be added after the script format survives one or two real passages.

## Episode JSON

Use:

- `schemas/podcast_episode.schema.json`

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
- optional `frame_id`
- optional `visual_anchor`
- optional `pronunciation_note`

`frame_id` is optional because podcast pacing should not be forced into a frame cut on every line.

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

- Narrator uses the main subtitle accent color.
- Listener uses a second accent color.
- Keep the same subtitle box position and typography for both speakers.
- Do not add talking-head avatars or podcast host portraits.

The color distinction is enough to tell the viewer who is speaking while preserving the comic as the visual focus.

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

## Relationship To Motion Comic Short

Podcast and motion comic short share some audio style rules, but they are different products.

Podcast:

- 1.5-3 minutes
- audio-first
- can be understood without video
- may hold or ignore comic frames

Motion comic short:

- usually under 30 seconds
- video-first
- line timing follows short-form visual pacing
- every beat should map tightly to current comic assets

Use:

- podcast: `story/<passage>/podcast/runNNN/`
- motion comic short: `story/<passage>/video/runNNN/`

## Future Work

After MVP script runs are stable:

- add a generator for per-line TTS
- add MP3 concatenation with measured durations
- add subtitle export
- add frontend playback with line and optional frame sync
- add A/B testing for narrator/listener voice pairs
