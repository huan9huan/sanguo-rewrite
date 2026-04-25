# Podcast Video Copy Eval

## Decision

Pass.

## Audience Assumption

This review assumes a medium-level foreign viewer watching a vertical motion comic with partial attention and limited prior knowledge of Three Kingdoms.

## Findings

- [P3] Video subtitles support speaker identity without adding UI clutter
  - Location: rendered subtitle system
  - Issue: Two-host audio can confuse viewers if speaker identity is unclear.
  - Suggested fix: Already handled through color-coded Narrator and Listener subtitles.

- [P3] Upload metadata is cold-audience friendly
  - Location: `video/upload_metadata_en.md`
  - Issue: YouTube copy must work for viewers who have not seen the project before.
  - Suggested fix: Already handled. Title names Three Kingdoms and description explains the setup.

## Cultural Load Map

| Term | Risk | Current support | Action |
|---|---|---|---|
| Three Kingdoms | Medium | Appears in title and script setup | Keep |
| Yellow Turban Rebellion | Medium | Description names it after explaining healer-to-rebel arc | Keep |
| Youzhou | Medium | Description says city gate in Youzhou; script clarifies northern region | Keep |
| Zhang Jiao | Medium | Description identifies him as a healer becoming rebel leader | Keep |

## Listener Clarification Opportunities

No required additions for this rendered video.

## Metadata Check

- Short Title: Pass.
- Title: Pass.
- Description: Pass.
- Tweet: Pass.

## Final Notes

The upload copy and video subtitle approach are ready for a cold YouTube audience. If future episodes include more names or titles, run this evaluation before TTS so fixes can happen before audio generation.
