"use client";

import { useEffect, useRef } from "react";
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
  const firedEvents = useRef(new Set<string>());

  useEffect(() => {
    const locale = window.location.pathname.startsWith("/en") ? "en" : "zh";
    trackEvent("read_start", {
      locale,
      book_id: bookId,
      chapter_id: chapterId,
      passage_id: passageId,
      mode: "text",
    });

    const timers = [
      window.setTimeout(() => {
        if (firedEvents.current.has("reading_30s")) return;
        firedEvents.current.add("reading_30s");
        trackEvent("reading_30s", {
          locale,
          book_id: bookId,
          chapter_id: chapterId,
          passage_id: passageId,
          mode: "text",
        });
      }, 30_000),
      window.setTimeout(() => {
        if (firedEvents.current.has("reading_90s")) return;
        firedEvents.current.add("reading_90s");
        trackEvent("reading_90s", {
          locale,
          book_id: bookId,
          chapter_id: chapterId,
          passage_id: passageId,
          mode: "text",
        });
      }, 90_000),
    ];

    const handleScroll = () => {
      const target =
        document.querySelector<HTMLElement>(".scene-reading-flow") ??
        document.querySelector<HTMLElement>(".passage-main");
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const visibleBottom = viewportHeight - rect.top;
      const progress = Math.max(0, Math.min(1, visibleBottom / Math.max(rect.height, 1)));

      if (progress >= 0.5 && !firedEvents.current.has("passage_scroll_50")) {
        firedEvents.current.add("passage_scroll_50");
        trackEvent("passage_scroll_50", {
          locale,
          book_id: bookId,
          chapter_id: chapterId,
          passage_id: passageId,
          mode: "text",
        });
      }

      if (progress >= 0.9 && !firedEvents.current.has("passage_scroll_90")) {
        firedEvents.current.add("passage_scroll_90");
        trackEvent("passage_scroll_90", {
          locale,
          book_id: bookId,
          chapter_id: chapterId,
          passage_id: passageId,
          mode: "text",
        });
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("scroll", handleScroll);
    };
  }, [bookId, chapterId, passageId]);

  return null;
}
