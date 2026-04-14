"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/client/analytics";
import type { Locale } from "@/lib/types";

type ComicViewTrackerProps = {
  bookId: string;
  chapterId: string;
  passageId: string;
  locale: Locale;
};

export function ComicViewTracker({
  bookId,
  chapterId,
  passageId,
  locale,
}: ComicViewTrackerProps) {
  useEffect(() => {
    const params = {
      locale,
      book_id: bookId,
      chapter_id: chapterId,
      passage_id: passageId,
      mode: "comic",
    };

    trackEvent("comic_view", params);
    trackEvent("comic_open", params);
  }, [bookId, chapterId, passageId, locale]);

  return null;
}
