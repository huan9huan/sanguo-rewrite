import { getCloudflareContext } from "@opennextjs/cloudflare";

export type DbResult =
  | { db: import("@/lib/db/reader").D1DatabaseLike; ok: true }
  | { ok: false; reason: string };

export function getDb(): DbResult {
  const { env } = getCloudflareContext();

  if (!env.DB) {
    return { ok: false, reason: "D1 is not bound" };
  }

  return { db: env.DB, ok: true };
}

export function jsonResponse(data: Record<string, unknown>, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...init?.headers },
  });
}
