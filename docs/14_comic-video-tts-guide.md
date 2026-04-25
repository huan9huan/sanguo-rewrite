# Comic Video TTS Guide

## Goal
Motion comic shorts should use TTS as performance, not just narration.

The audio should make the video easier to follow on a phone:

- clear narrator identity
- useful listener identity when dialogue mode is used
- natural sentence rhythm
- controlled pauses before story turns
- serious tone without melodrama
- clean pronunciation of names

## Default Engine
Use Google Cloud Text-to-Speech.

For new motion comic runs, prefer Chirp 3 HD voices unless audition results show a better voice.

Chirp 3 HD should be treated as a conversation-capable voice family, not just a better single narrator. It offers distinct voice styles across languages and supports controls that matter for chat-like listening:

- pace control
- pause control
- custom pronunciation
- text streaming for low-latency chat experiences

For this project, the default production mode is still offline synthesis for short videos. Use the chat-experience model at the script and voice-cast level first; adopt text streaming later only if building an interactive preview or live narration tool.

Project tools:

- `tools/google_tts.py`
- `tools/list_google_tts_voices.py`
- `tools/audition_google_tts_voices.py`

## Input Kinds
`tools/google_tts.py` supports:

- `text`: plain text
- `ssml`: SSML input
- `markup`: Chirp-style markup such as `[pause long]`

Recommended use:

- Use `markup` for Chirp 3 HD audition and most short-video narration.
- Use `ssml` when exact `<break time="800ms"/>` control is needed.
- Use `text` for quick baseline tests.

## Voice Cast
Do not use one flat voice for every line by default.

A good short usually has:

- narrator voice
- listener voice
- optional oath / quoted vow voice
- optional danger / turn voice

Keep it restrained. If a line does not need a distinct voice, keep the narrator.

## Dialogue Mode
Default script mode for new motion comic shorts:

`narrator_listener_dialogue`

This is a two-speaker audio shape inspired by chat experiences:

- narrator: tells the story and carries authority
- listener: asks the viewer's question, reacts briefly, or marks the turn

The listener exists to improve listening comfort and story clarity.
The listener is not a lore lecturer and should not compete with the narrator.

The goal is not to imitate a radio drama.
The goal is to make history easier to hear, with enough back-and-forth that the viewer feels guided through the story.

Good structure:

```text
NARRATOR: 桃园里，三个人跪在一起。
LISTENER: 他们要做什么？
NARRATOR: 他们要把命，交给同一个誓言。
LISTENER: 只是结拜吗？
NARRATOR: 不。是乱世里的第一道选择。
```

Good English structure:

```text
NARRATOR: In a peach garden, three men knelt together.
LISTENER: What were they promising?
NARRATOR: Their lives, their loyalty, and a future none of them could see.
LISTENER: So this was more than friendship?
NARRATOR: It was the first choice that pulled them into history.
```

Balance:

- 60-75% narrator
- 25-40% listener
- 4-8 spoken turns for a 20-30 second short
- listener turns should be short
- one listener question per story beat is enough

For a longer audio-first experiment, 8-12 spoken turns is acceptable if the story line benefits from it. Do not force a fixed number of turns.

Avoid:

- joke-host energy
- fake surprise after every sentence
- explaining background through the listener
- making the listener smarter than the story
- adding facts that are not in current approved text

Use single narrator when the scene is too solemn, too short, or too context-light for a useful listener.

## Chinese Shortlist
- narrator: `cmn-CN-Chirp3-HD-Charon`
- listener: `cmn-CN-Chirp3-HD-Iapetus` or `cmn-CN-Chirp3-HD-Achird`
- epic / oath: `cmn-CN-Chirp3-HD-Orus`
- pressure / danger: `cmn-CN-Chirp3-HD-Fenrir`
- warm resolve: `cmn-CN-Chirp3-HD-Iapetus`
- baseline fallback: `cmn-CN-Wavenet-A`

Suggested rates:

- narrator: `0.9-0.98`
- listener: `0.96-1.04`
- oath: `0.82-0.9`
- danger: `0.95-1.03`

## English Shortlist
- narrator: `en-US-Chirp3-HD-Charon`
- listener: `en-US-Chirp3-HD-Iapetus` or `en-US-Chirp3-HD-Achird`
- epic / oath: `en-US-Chirp3-HD-Orus`
- pressure / danger: `en-US-Chirp3-HD-Fenrir`
- British documentary tone: `en-GB-Chirp3-HD-Charon`
- baseline fallback: `en-US-Neural2-J`

Suggested rates:

- narrator: `0.92-0.98`
- listener: `0.98-1.05`
- oath: `0.86-0.92`
- danger: `0.96-1.04`

## Pause Strategy
Good pause positions:

- before an oath
- after a key name
- before a major turn
- after a slogan or vow
- before the final hook
- between narrator and listener when the listener changes the viewer's attention

Avoid:

- pauses inside names
- pauses after every sentence
- repeated `[pause long]`
- using TTS pause when the render needs exact silence timing

If exact alignment is required, use shared silence assets from `assets/comic-video/manifest.json` in the final mix.

## Pronunciation Strategy
Use custom pronunciation controls when a name or term sounds unstable across voices.

Priority terms:

- 刘备
- 关羽
- 张飞
- 张角
- 黄巾
- 幽州
- Three Kingdoms
- Liu Bei
- Guan Yu
- Zhang Fei
- Zhang Jue

For English scripts, audition names before rendering the final mix. If pronunciation is poor, either add a custom pronunciation rule or lightly rewrite the line to reduce friction.

## Streaming Strategy
Chirp 3 HD supports text streaming for low-latency communication, but motion comic production does not need streaming by default.

Use standard per-segment synthesis for:

- final short video audio
- reproducible manifests
- exact segment durations
- subtitle timing
- QA and rerenders

Consider streaming only for:

- live script audition
- interactive voice preview
- a future chat-style review tool
- rapid comparison of narrator/listener pairings

Do not make final video rendering depend on streaming until the pipeline can record streamed chunks with stable manifests.

## Audition Workflow
List available voices:

```bash
python3 tools/list_google_tts_voices.py \
  --language-code cmn-CN \
  --family Chirp3-HD
```

Generate a Chinese audition:

```bash
python3 tools/audition_google_tts_voices.py \
  --language-code cmn-CN \
  --out-dir /tmp/sanguo_voice_audition_zh \
  --input-kind markup \
  --rate 0.9
```

Generate an English audition:

```bash
python3 tools/audition_google_tts_voices.py \
  --language-code en-US \
  --out-dir /tmp/sanguo_voice_audition_en \
  --input-kind markup \
  --rate 0.94
```

Generate a dialogue audition by passing a custom short line for each speaker voice:

```bash
python3 tools/audition_google_tts_voices.py \
  --language-code cmn-CN \
  --voice cmn-CN-Chirp3-HD-Charon \
  --voice cmn-CN-Chirp3-HD-Iapetus \
  --text "桃园里，三个人跪在一起。[pause] 他们要做什么？" \
  --out-dir /tmp/sanguo_dialogue_audition_zh \
  --input-kind markup \
  --rate 0.94
```

## Selection Criteria
Pick the voice that is:

- intelligible on phone speakers
- serious but not fake-grand
- natural at the target rate
- clear with Chinese names in English scripts
- emotionally controlled during oath lines
- distinct enough between narrator and listener without sounding like a skit

Record the chosen voice and rejected alternatives in `voice_cast_<lang>.json`.

## Manifest Requirements
For dialogue runs, `audio_manifest_<lang>_natural.json` should preserve:

- `speaker_id`
- `voice_id`
- Google voice name
- `input_kind`
- speaking rate
- pause strategy
- custom pronunciation rules if used
- per-segment duration
- final mix duration

This is necessary because conversational audio quality depends on speaker alternation, not just the final waveform.
