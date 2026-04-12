import { getDb, jsonResponse } from "@/lib/api-helpers";
import { getActiveSession, heartbeatSession, openBookSession, insertReadingEvent } from "@/lib/db/reader";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId : "";
  const bookId = typeof body.bookId === "string" ? body.bookId : "";
  const locale = typeof body.locale === "string" ? body.locale : undefined;
  const chapterId = typeof body.chapterId === "string" ? body.chapterId : undefined;
  const passageId = typeof body.passageId === "string" ? body.passageId : undefined;

  if (!userId || !bookId) {
    return jsonResponse({ ok: false, error: "missing_userId_or_bookId" }, { status: 400 });
  }

  const result = getDb();
  if (!result.ok) {
    return jsonResponse({ ok: true, sessionId: null, message: result.reason });
  }

  const db = result.db;

  // Reuse active session if exists
  const active = await getActiveSession(db, userId, bookId);
  if (active) {
    await heartbeatSession(db, active.session_id, { chapterId, passageId });
    await insertReadingEvent(db, {
      eventId: crypto.randomUUID(),
      sessionId: active.session_id,
      userId,
      eventType: "resume",
      bookId,
      chapterId,
      passageId,
      locale,
    });
    return jsonResponse({
      ok: true,
      sessionId: active.session_id,
      resumed: true,
      heartbeatCount: active.heartbeat_count + 1,
    });
  }

  // Create new session
  const sessionId = crypto.randomUUID();
  await openBookSession(db, sessionId, userId, bookId, locale);
  await insertReadingEvent(db, {
    eventId: crypto.randomUUID(),
    sessionId,
    userId,
    eventType: "start",
    bookId,
    chapterId,
    passageId,
    locale,
  });

  return jsonResponse({ ok: true, sessionId, resumed: false });
}
