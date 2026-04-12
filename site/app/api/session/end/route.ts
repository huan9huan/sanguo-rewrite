import { getDb, jsonResponse } from "@/lib/api-helpers";
import { endSession, insertReadingEvent } from "@/lib/db/reader";

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

  if (!sessionId) {
    return jsonResponse({ ok: false, error: "missing_sessionId" }, { status: 400 });
  }

  const result = getDb();
  if (!result.ok) {
    return jsonResponse({ ok: true, message: result.reason });
  }

  const db = result.db;

  await endSession(db, sessionId);

  if (userId && bookId) {
    await insertReadingEvent(db, {
      eventId: crypto.randomUUID(),
      sessionId,
      userId,
      eventType: "end",
      bookId,
    });
  }

  return jsonResponse({ ok: true });
}
