"use client";

import { useEffect } from "react";

type ReadingBookmarkSyncProps = {
  bookId: string;
  chapterId: string;
  passageId: string;
};

const BOOKMARK_KEY_PREFIX = "reading-bookmark:";

export function ReadingBookmarkSync({ bookId, chapterId, passageId }: ReadingBookmarkSyncProps) {
  useEffect(() => {
    try {
      window.localStorage.setItem(
        `${BOOKMARK_KEY_PREFIX}${bookId}`,
        JSON.stringify({
          bookId,
          chapterId,
          passageId,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {
      // Ignore storage errors in private mode or restricted environments.
    }
  }, [bookId, chapterId, passageId]);

  return null;
}
