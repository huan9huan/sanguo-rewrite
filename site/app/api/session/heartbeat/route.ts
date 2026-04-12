import { getDb, jsonResponse } from "@/lib/api-helpers";
import { heartbeatSession, insertReadingEvent } from "@/lib/db/reader";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const userId = typeof body.userId === "string" ? body.userId : "";
  const bookId = typeof body.bookId === "string" ? body.bookId : "";
  const visibleMs = typeof body.visibleMs === "number" ? body.visibleMs : 0;
  const chapterId = typeof body.chapterId === "string" ? body.chapterId : undefined;
  const passageId = typeof body.passageId === "string" ? body.passageId : undefined;
  const mode = typeof body.mode === "string" ? body.mode : undefined;
  const path = typeof body.path === "string" ? body.path : undefined;

  if (!sessionId) {
    return jsonResponse({ ok: false, error: "missing_sessionId" }, { status: 400 });
  }

  const result = getDb();
  if (!result.ok) {
    return jsonResponse({ ok: true, message: result.reason });
  }

  const db = result.db;

  await heartbeatSession(db, sessionId, { visibleMs, chapterId, passageId, mode, path });

  if (userId && bookId) {
    await insertReadingEvent(db, {
      eventId: crypto.randomUUID(),
      sessionId,
      userId,
      eventType: "heartbeat",
      bookId,
      chapterId,
      passageId,
      mode,
      path,
      visibleMs,
    });
  }

  return jsonResponse({ ok: true });
}
