// DB access layer for anonymous users and book reading sessions.
// Inspired by sanguo/apps/api/src/db.ts — uses D1DatabaseLike abstraction for testability.

type D1Statement = {
  first: <T>() => Promise<T | null>;
  run: () => Promise<unknown>;
  bind: (...values: unknown[]) => D1Statement;
};

export type D1DatabaseLike = {
  prepare: (sql: string) => D1Statement;
};

function nowIso() {
  return new Date().toISOString();
}

// ── Row types ──

type AnonymousUserRow = {
  user_id: string;
  first_seen_at: string;
  last_seen_at: string;
  first_locale: string | null;
  last_locale: string | null;
};

type BookSessionRow = {
  session_id: string;
  user_id: string;
  book_id: string;
  locale: string | null;
  started_at: string;
  last_seen_at: string;
  ended_at: string | null;
  expire_after_seconds: number;
  heartbeat_count: number;
  total_visible_ms: number;
  last_chapter_id: string | null;
  last_passage_id: string | null;
  last_mode: string | null;
  last_path: string | null;
};

// ── Anonymous Users ──

export async function initAnonymousUser(
  db: D1DatabaseLike,
  userId: string,
  locale: string,
): Promise<{ userId: string; created: boolean }> {
  const existing = await db
    .prepare("SELECT user_id FROM anonymous_users WHERE user_id = ?")
    .bind(userId)
    .first<AnonymousUserRow>();

  const now = nowIso();

  if (!existing) {
    await db
      .prepare(
        `INSERT INTO anonymous_users (user_id, first_seen_at, last_seen_at, first_locale, last_locale)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(userId, now, now, locale, locale)
      .run();
    return { userId, created: true };
  }

  await db
    .prepare(
      `UPDATE anonymous_users SET last_seen_at = ?, last_locale = ? WHERE user_id = ?`,
    )
    .bind(now, locale, userId)
    .run();

  return { userId, created: false };
}

// ── Book Sessions ──

export async function getActiveSession(
  db: D1DatabaseLike,
  userId: string,
  bookId: string,
): Promise<BookSessionRow | null> {
  return db
    .prepare(
      `SELECT session_id, user_id, book_id, locale, started_at, last_seen_at,
              ended_at, expire_after_seconds, heartbeat_count, total_visible_ms,
              last_chapter_id, last_passage_id, last_mode, last_path
       FROM book_sessions
       WHERE user_id = ? AND book_id = ? AND ended_at IS NULL
       ORDER BY last_seen_at DESC LIMIT 1`,
    )
    .bind(userId, bookId)
    .first<BookSessionRow>();
}

export async function openBookSession(
  db: D1DatabaseLike,
  sessionId: string,
  userId: string,
  bookId: string,
  locale?: string,
): Promise<BookSessionRow> {
  const now = nowIso();

  await db
    .prepare(
      `INSERT INTO book_sessions (session_id, user_id, book_id, locale, started_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(sessionId, userId, bookId, locale ?? null, now, now)
    .run();

  return {
    session_id: sessionId,
    user_id: userId,
    book_id: bookId,
    locale: locale ?? null,
    started_at: now,
    last_seen_at: now,
    ended_at: null,
    expire_after_seconds: 1800,
    heartbeat_count: 0,
    total_visible_ms: 0,
    last_chapter_id: null,
    last_passage_id: null,
    last_mode: null,
    last_path: null,
  };
}

export async function heartbeatSession(
  db: D1DatabaseLike,
  sessionId: string,
  opts?: {
    visibleMs?: number;
    chapterId?: string;
    passageId?: string;
    mode?: string;
    path?: string;
  },
): Promise<void> {
  const now = nowIso();
  const visibleMs = opts?.visibleMs ?? 0;

  await db
    .prepare(
      `UPDATE book_sessions
       SET last_seen_at = ?,
           heartbeat_count = heartbeat_count + 1,
           total_visible_ms = total_visible_ms + ?,
           last_chapter_id = COALESCE(?, last_chapter_id),
           last_passage_id = COALESCE(?, last_passage_id),
           last_mode = COALESCE(?, last_mode),
           last_path = COALESCE(?, last_path)
       WHERE session_id = ? AND ended_at IS NULL`,
    )
    .bind(
      now,
      visibleMs,
      opts?.chapterId ?? null,
      opts?.passageId ?? null,
      opts?.mode ?? null,
      opts?.path ?? null,
      sessionId,
    )
    .run();
}

export async function endSession(
  db: D1DatabaseLike,
  sessionId: string,
): Promise<boolean> {
  const now = nowIso();
  await db
    .prepare("UPDATE book_sessions SET ended_at = ? WHERE session_id = ? AND ended_at IS NULL")
    .bind(now, sessionId)
    .run();
  return true;
}

// ── Reading Events ──

export async function insertReadingEvent(
  db: D1DatabaseLike,
  event: {
    eventId: string;
    sessionId: string;
    userId: string;
    eventType: string;
    bookId: string;
    chapterId?: string;
    passageId?: string;
    locale?: string;
    mode?: string;
    path?: string;
    visible?: number;
    visibleMs?: number;
  },
): Promise<void> {
  const now = nowIso();

  await db
    .prepare(
      `INSERT INTO reading_events (
         event_id, session_id, user_id, event_type, book_id,
         chapter_id, passage_id, locale, mode, path,
         visible, visible_ms, client_time
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      event.eventId,
      event.sessionId,
      event.userId,
      event.eventType,
      event.bookId,
      event.chapterId ?? null,
      event.passageId ?? null,
      event.locale ?? null,
      event.mode ?? null,
      event.path ?? null,
      event.visible ?? 1,
      event.visibleMs ?? 0,
      now,
    )
    .run();
}
