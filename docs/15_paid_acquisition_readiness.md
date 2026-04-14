# Paid Acquisition Readiness

Use this checklist before testing Google Ads or any other paid traffic.

## Goal

Do not buy traffic just to prove the site can receive traffic. The goal is to decide whether the current product can explain itself, get readers into the text, and show early signs of retention.

## Preconditions

Before any paid acquisition test, all of these should be true:

1. The homepage clearly explains the project and gives a direct reading entry.
2. The About page is live and explains purpose, workflow, and current scope.
3. Core SEO basics are in place on major pages:
   - metadata
   - canonical
   - hreflang
   - sitemap
   - robots
4. Main reading pages are indexable:
   - homepage
   - book page
   - chapter page
   - passage page
5. Funnel and retention events are available in analytics.
6. There is a first natural-user sample of roughly 20 readers.

## First 20 Users Review

For the first ~20 natural users, review at least:

- how many `landing_view` users trigger `start_reading_click`
- how many `passage_open` users reach `reading_90s`
- how many `passage_open` users reach `passage_scroll_90`
- how many readers trigger `next_passage_click`
- how many readers trigger `comic_open`
- whether English readers drop earlier than Chinese readers
- whether users stay on homepage or About without entering reading

## Good Signs

Paid acquisition can move to a small test when most of these are true:

- homepage to reading flow has no obvious confusion
- at least some readers reach `reading_90s`
- at least some readers click `next_passage_click`
- comic mode is opened by a non-trivial share of passage readers
- search snippets look credible in title and description
- homepage and About no longer feel like a temporary demo

## Red Flags

Keep fixing the product first if any of these dominate:

- most users stop at homepage or About
- readers open a passage and leave quickly
- almost nobody reaches `reading_90s`
- almost nobody clicks the next passage
- comic mode is almost never opened
- English readers fall off much earlier than Chinese readers

## Small-Test Rule

The first paid test should stay small enough that a weak result is still interpretable. Do not scale spend until the team can explain:

1. where users entered
2. where they dropped
3. whether they reached meaningful reading behavior
4. whether English and Chinese users behave differently

## Not A Success Metric

Pageviews alone are not a success metric. A traffic test is only useful if it improves understanding of reading behavior.
