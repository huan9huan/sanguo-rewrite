const REASONS = [
  { id: "liked", label: "赞", labelEn: "Like", category: "Positive Signal" },
  { id: "story_not_engaging", label: "故事不好看", labelEn: "Story not engaging", category: "Story Review" },
  { id: "character_wrong", label: "人物不像 / 情绪不对", labelEn: "Character / emotion off", category: "Story Review" },
  { id: "chinese_too_hard", label: "中文太难", labelEn: null, category: "Readability" },
  { id: "comic_confusing", label: "漫画看不懂", labelEn: "Comic confusing", category: "Comic QA" },
  { id: "image_quality", label: "图片质量有问题", labelEn: "Image quality issue", category: "Comic QA" },
  { id: "clarity", label: null, labelEn: "Hard to understand", category: "EN Readability" },
  { id: "naturalness", label: null, labelEn: "Unnatural English", category: "EN Readability" },
  { id: "culture_fit", label: null, labelEn: "Culture gap / context missing", category: "EN Readability" },
  { id: "name_confusion", label: null, labelEn: "Names / terms confusing", category: "EN Readability" },
  { id: "story_flow", label: null, labelEn: "Story flow broken", category: "EN Readability" },
  { id: "other", label: "其他", labelEn: "Other", category: "Manual Triage" },
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
  reasons?: string[];
  detail?: string;
  locale?: string;
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
  const detail = (body.detail ?? "").trim();
  const locale = (body.locale ?? "zh").trim();

  // Support both single reason (liked) and multiple reasons
  const rawReasons = Array.isArray(body.reasons) ? body.reasons : (body.reason ? [body.reason] : []);

  if (!bookId || !chapterId || !passageId) {
    return Response.json({ error: "Missing passage path." }, { status: 422 });
  }

  if (!MODES.has(mode)) {
    return Response.json({ error: "Invalid mode." }, { status: 422 });
  }

  const validReasons = rawReasons.filter((r) => REASON_IDS.has(r));
  if (rawReasons.length > 0 && validReasons.length === 0) {
    return Response.json({ error: "Invalid reason." }, { status: 422 });
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      const detailBlock = detail
        ? [{ type: "section", text: { type: "mrkdwn", text: `*Detail:*\n${detail}` } }]
        : [];

      const isLiked = validReasons.length === 0;
      const reasonLabels = isLiked
        ? ["liked"]
        : validReasons.map((r) => {
            const entry = REASON_MAP.get(r);
            if (!entry) return r;
            return locale === "en" && entry.labelEn
              ? entry.labelEn
              : (entry.label ?? entry.labelEn ?? r);
          });
      const categories = isLiked
        ? ["Positive Signal"]
        : [...new Set(validReasons.map((r) => REASON_MAP.get(r)?.category).filter(Boolean))];

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `📝 Passage feedback: *${reasonLabels.join(", ")}* [${categories.join(", ")}] — ${bookId}/${chapterId}/${passageId} (${mode}, ${locale})`,
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
                { type: "mrkdwn", text: `*Locale:*\n${locale}` },
                { type: "mrkdwn", text: `*Reasons:*\n${reasonLabels.join(", ")}` },
                { type: "mrkdwn", text: `*Categories:*\n${categories.join(", ")}` },
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
