"use client";

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
  return null;
}
