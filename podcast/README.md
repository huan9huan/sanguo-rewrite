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
- `agents/podcast-audio-operator.md`
- `agents/build-podcast-video.md`
- `schemas/podcast_episode.schema.json`
- `pipeline/manage_podcast_workspace.py`
- `pipeline/build_podcast_audio.py`
- `pipeline/export_podcast_script.py`
- `pipeline/render_podcast_motion_comic.py`

## First MVP

For the first real trial, create a script-only run:

```bash
python3 -m pipeline.manage_podcast_workspace init-run story/cp001-p01 --lang en
```

Then use `agents/build-podcast-episode.md` to write:

- `episode_en.json`
- `script_en.md`
- `self_check_en.md`

After the script shape is approved, generate audio through the shared pipeline:

```bash
python3 -m pipeline.build_podcast_audio \
  --run story/cp001-p01/podcast/run001 \
  --lang en
```

Do not create a per-run `build_audio.py`.

## Product Boundary

Podcast is audio-first.

It may reference current comic frames for optional sync, but it should still make sense without the comic image.

Standalone motion comic short production is deprecated for new work.
Do not create new output under:

```text
story/<passage>/video/runNNN/
```

Podcast-driven video uses podcast audio as the timeline and writes under:

```text
story/<passage>/podcast/runNNN/video/
```
