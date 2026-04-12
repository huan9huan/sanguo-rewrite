import type { Locale, LocalizedPassageContent, Passage } from "./types";

export function resolveLocalizedPassage(passage: Passage, locale: Locale): LocalizedPassageContent | null {
  if (locale === "zh") {
    return (
      passage.localized?.zh ?? {
        title: passage.title,
        short_title: passage.short_title,
        catchup: passage.catchup,
        reading: passage.reading,
      }
    );
  }

  return passage.localized?.[locale] ?? null;
}
