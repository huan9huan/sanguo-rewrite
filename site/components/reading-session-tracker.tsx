"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/client/analytics";
import { useReadingSession } from "@/lib/client/user-session";

export function ReadingSessionTracker({
  bookId,
  chapterId,
  passageId,
}: {
  bookId: string;
  chapterId: string;
  passageId: string;
}) {
  useReadingSession(bookId, chapterId, passageId);

  useEffect(() => {
    const locale = window.location.pathname.startsWith("/en") ? "en" : "zh";
    trackEvent("read_start", {
      locale,
      book_id: bookId,
      chapter_id: chapterId,
      passage_id: passageId,
      mode: "text",
    });
  }, [bookId, chapterId, passageId]);

  return null;
}
