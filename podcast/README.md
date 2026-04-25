# Podcast Subproject

This folder holds shared conventions and templates for the podcast/audio-story product line.

Passage-specific production runs do not live here.
They live under:

```text
story/<passage>/podcast/runNNN/
```

Core files:

- `docs/17_podcast-workflow.md`
- `agents/build-podcast-episode.md`
- `schemas/podcast_episode.schema.json`
- `pipeline/manage_podcast_workspace.py`

## First MVP

For the first real trial, create a script-only run:

```bash
python3 -m pipeline.manage_podcast_workspace init-run story/cp001-p01 --lang en
```

Then use `agents/build-podcast-episode.md` to write:

- `episode_en.json`
- `script_en.md`
- `self_check_en.md`

Add TTS only after the script shape is approved.

## Product Boundary

Podcast is audio-first.

It may reference current comic frames for optional sync, but it should still make sense without the comic image.

Do not use this folder for motion comic short output.
Motion comic short output belongs under:

```text
story/<passage>/video/runNNN/
```
