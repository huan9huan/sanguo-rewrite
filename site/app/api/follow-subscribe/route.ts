const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TRIGGERS = new Set([
  "next_chapter_unavailable",
  "chapter_3_reached",
  "unfinished_passage",
]);

type Body = {
  bookId?: string;
  chapterId?: string;
  passageId?: string;
  trigger?: string;
  email?: string;
  locale?: string;
  website?: string;
};

export async function POST(request: Request): Promise<Response> {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.website) {
    return Response.json({ ok: true });
  }

  const bookId = (body.bookId ?? "").trim();
  const chapterId = (body.chapterId ?? "").trim();
  const passageId = (body.passageId ?? "").trim();
  const trigger = (body.trigger ?? "").trim();
  const email = (body.email ?? "").trim();
  const locale = (body.locale ?? "zh").trim();

  if (!bookId || !chapterId || !passageId) {
    return Response.json({ error: "Missing passage path." }, { status: 422 });
  }

  if (!TRIGGERS.has(trigger)) {
    return Response.json({ error: "Invalid trigger." }, { status: 422 });
  }

  if (!email || !EMAIL_RE.test(email)) {
    return Response.json({ error: "请输入有效的邮箱地址。" }, { status: 422 });
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `📬 New follow subscription: *${bookId}/${chapterId}/${passageId}* — ${email} [${trigger}, ${locale}]`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "📬 *New follow subscription*",
              },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Passage:*\n${bookId}/${chapterId}/${passageId}` },
                { type: "mrkdwn", text: `*Trigger:*\n${trigger}` },
                { type: "mrkdwn", text: `*Locale:*\n${locale}` },
                { type: "mrkdwn", text: `*Email:*\n${email}` },
                { type: "mrkdwn", text: `*Source:*\n${request.headers.get("referer") ?? "unknown"}` },
                { type: "mrkdwn", text: `*Time:*\n${new Date().toISOString()}` },
              ],
            },
          ],
        }),
      });
    } catch {
      console.error("Failed to send follow subscription notification");
    }
  }

  return Response.json({ ok: true });
}
