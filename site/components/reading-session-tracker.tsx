"use client";

import { useReadingSession } from "@/lib/client/user-session";

export function ReadingSessionTracker({ bookId }: { bookId: string }) {
  useReadingSession(bookId);
  return null;
}
