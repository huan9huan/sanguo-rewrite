-- D1 schema for issue #59: reading session heartbeat persistence.
--
-- Scope:
-- - anonymous reader identity
-- - book-scoped reading sessions
-- - lightweight reading events for start/resume/heartbeat/pause
--
-- Privacy rule:
-- Do not store email, account id, IP address, user agent, or browser fingerprint.

CREATE TABLE IF NOT EXISTS anonymous_users (
  user_id TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  first_locale TEXT,
  last_locale TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (user_id <> ''),
  CHECK (first_locale IS NULL OR first_locale IN ('zh', 'en')),
  CHECK (last_locale IS NULL OR last_locale IN ('zh', 'en'))
);

CREATE TABLE IF NOT EXISTS book_sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  locale TEXT,
  started_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  ended_at TEXT,
  expire_after_seconds INTEGER NOT NULL DEFAULT 1800,
  heartbeat_count INTEGER NOT NULL DEFAULT 0,
  total_visible_ms INTEGER NOT NULL DEFAULT 0,
  last_chapter_id TEXT,
  last_passage_id TEXT,
  last_mode TEXT,
  last_path TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES anonymous_users(user_id) ON DELETE CASCADE,
  CHECK (session_id <> ''),
  CHECK (user_id <> ''),
  CHECK (book_id <> ''),
  CHECK (locale IS NULL OR locale IN ('zh', 'en')),
  CHECK (last_mode IS NULL OR last_mode IN ('book', 'chapter', 'text', 'comic')),
  CHECK (expire_after_seconds > 0),
  CHECK (heartbeat_count >= 0),
  CHECK (total_visible_ms >= 0)
);

CREATE TABLE IF NOT EXISTS reading_events (
  event_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  book_id TEXT NOT NULL,
  chapter_id TEXT,
  passage_id TEXT,
  locale TEXT,
  mode TEXT,
  path TEXT,
  visible INTEGER NOT NULL DEFAULT 1,
  visible_ms INTEGER NOT NULL DEFAULT 0,
  client_time TEXT,
  server_time TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  metadata_json TEXT,
  FOREIGN KEY (session_id) REFERENCES book_sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES anonymous_users(user_id) ON DELETE CASCADE,
  CHECK (event_id <> ''),
  CHECK (session_id <> ''),
  CHECK (user_id <> ''),
  CHECK (event_type IN ('start', 'resume', 'heartbeat', 'pause', 'end', 'navigate')),
  CHECK (book_id <> ''),
  CHECK (locale IS NULL OR locale IN ('zh', 'en')),
  CHECK (mode IS NULL OR mode IN ('book', 'chapter', 'text', 'comic')),
  CHECK (visible IN (0, 1)),
  CHECK (visible_ms >= 0),
  CHECK (metadata_json IS NULL OR json_valid(metadata_json))
);

CREATE INDEX IF NOT EXISTS idx_anonymous_users_last_seen
  ON anonymous_users(last_seen_at);

CREATE INDEX IF NOT EXISTS idx_book_sessions_user_last_seen
  ON book_sessions(user_id, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_book_sessions_book_last_seen
  ON book_sessions(book_id, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_book_sessions_open
  ON book_sessions(book_id, ended_at, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_reading_events_session_time
  ON reading_events(session_id, server_time DESC);

CREATE INDEX IF NOT EXISTS idx_reading_events_book_time
  ON reading_events(book_id, server_time DESC);

CREATE INDEX IF NOT EXISTS idx_reading_events_locale_time
  ON reading_events(locale, server_time DESC);
