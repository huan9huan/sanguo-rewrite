import { getDb, jsonResponse } from "@/lib/api-helpers";
import { initAnonymousUser } from "@/lib/db/reader";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId : "";
  const locale = typeof body.locale === "string" ? body.locale : "en";

  if (!userId) {
    return jsonResponse({ ok: false, error: "missing_userId" }, { status: 400 });
  }

  const result = getDb();
  if (!result.ok) {
    return jsonResponse({ ok: true, userId, message: result.reason });
  }

  const { created } = await initAnonymousUser(result.db, userId, locale);
  return jsonResponse({ ok: true, userId, created });
}
