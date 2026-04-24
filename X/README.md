# X Subproject

This subproject manages X posts for promoting the project.

## Goal

- keep every post in the repo
- make post history easy to review
- separate raw post writing from the website code

## Structure

```text
X/
  README.md
  content/
    manifest.json
  posts/
    2026-04-23-001-project-purpose.md
  threads/
    cp001-p01-thread-v1.md
```

## Post Rules

- one post per file
- filename format: `YYYY-MM-DD-NNN-short-slug.md`
- keep the final post text in a `Post` section
- keep link and hashtag inside the post text if they are required for publishing
- use `status` in front matter to mark draft or approved

## Thread Rules

- one thread per passage
- default source is `story/<passage>/current/approved_en.md` plus current comic assets
- one thread post maps to one scene image
- keep `frame_id` and source image path for each post so publishing can stay aligned with comic assets

## Current Direction

The first batch is for English-language posts that explain the purpose and meaning of the project to readers who do not already know Chinese classics.
