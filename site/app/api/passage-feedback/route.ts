const REASONS = [
  { id: "liked", label: "赞", category: "Positive Signal" },
  { id: "story_not_engaging", label: "故事不好看", category: "Story Review" },
  { id: "character_wrong", label: "人物不像 / 情绪不对", category: "Story Review" },
  { id: "chinese_too_hard", label: "中文太难", category: "Readability" },
  { id: "comic_confusing", label: "漫画看不懂", category: "Comic QA" },
  { id: "image_quality", label: "图片质量有问题", category: "Comic QA" },
  { id: "other", label: "其他", category: "Manual Triage" },
] as const;

const REASON_IDS = new Set<string>(REASONS.map((r) => r.id));

const REASON_MAP = new Map<string, (typeof REASONS)[number]>(REASONS.map((r) => [r.id, r]));

const MODES = new Set(["text", "comic"]);

type Body = {
  bookId?: string;
  chapterId?: string;
  passageId?: string;
  mode?: string;
  reason?: string;
  detail?: string;
  website?: string; // honeypot
};

export async function POST(request: Request): Promise<Response> {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot — if filled, silently accept
  if (body.website) {
    return Response.json({ ok: true });
  }

  const bookId = (body.bookId ?? "").trim();
  const chapterId = (body.chapterId ?? "").trim();
  const passageId = (body.passageId ?? "").trim();
  const mode = (body.mode ?? "").trim();
  const reason = (body.reason ?? "").trim();
  const detail = (body.detail ?? "").trim();

  if (!bookId || !chapterId || !passageId) {
    return Response.json({ error: "Missing passage path." }, { status: 422 });
  }

  if (!MODES.has(mode)) {
    return Response.json({ error: "Invalid mode." }, { status: 422 });
  }

  const reasonEntry = REASON_MAP.get(reason);
  if (!reasonEntry) {
    return Response.json({ error: "Invalid reason." }, { status: 422 });
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      const detailBlock = detail
        ? [{ type: "section", text: { type: "mrkdwn", text: `*Detail:*\n${detail}` } }]
        : [];

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `📝 Passage feedback: *${reasonEntry.label}* [${reasonEntry.category}] — ${bookId}/${chapterId}/${passageId} (${mode})`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `📝 *Passage feedback*`,
              },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Passage:*\n${bookId}/${chapterId}/${passageId}` },
                { type: "mrkdwn", text: `*Mode:*\n${mode}` },
                { type: "mrkdwn", text: `*Reason:*\n${reasonEntry.label}` },
                { type: "mrkdwn", text: `*Category:*\n${reasonEntry.category}` },
                { type: "mrkdwn", text: `*Source:*\n${request.headers.get("referer") ?? "unknown"}` },
                { type: "mrkdwn", text: `*Time:*\n${new Date().toISOString()}` },
              ],
            },
            ...detailBlock,
          ],
        }),
      });
    } catch {
      console.error("Failed to send Slack notification");
    }
  }

  return Response.json({ ok: true });
}
