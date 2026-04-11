const KNOWN_BOOKS = [
  { id: "xiyouji", title: "西游记" },
  { id: "shuihu", title: "水浒传" },
  { id: "hongloumeng", title: "红楼梦" },
  { id: "jinpingmei", title: "金瓶梅" },
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = {
  bookId?: string;
  email?: string;
  website?: string; // honeypot
};

export async function POST(request: Request): Promise<Response> {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot — if filled, silently accept (don't alert bots)
  if (body.website) {
    return Response.json({ ok: true });
  }

  const bookId = (body.bookId ?? "").trim();
  const email = (body.email ?? "").trim();

  if (!bookId || !KNOWN_BOOKS.some((b) => b.id === bookId)) {
    return Response.json({ error: "请选择一本书。" }, { status: 422 });
  }

  if (!email || !EMAIL_RE.test(email)) {
    return Response.json({ error: "请输入有效的邮箱地址。" }, { status: 422 });
  }

  const book = KNOWN_BOOKS.find((b) => b.id === bookId)!;
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `📚 New book interest: *${book.title}* (${bookId}) — ${email}`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `📚 *New book interest signal*`,
              },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Book:*\n${book.title}` },
                { type: "mrkdwn", text: `*Email:*\n${email}` },
                { type: "mrkdwn", text: `*Source:*\n${request.headers.get("referer") ?? "unknown"}` },
                { type: "mrkdwn", text: `*Time:*\n${new Date().toISOString()}` },
              ],
            },
          ],
        }),
      });
    } catch {
      // Slack notification failure should not block the user
      console.error("Failed to send Slack notification");
    }
  }

  return Response.json({ ok: true });
}
