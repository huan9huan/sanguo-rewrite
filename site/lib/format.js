export function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function proseToHtml(text) {
  if (!text) {
    return "<p>暂无内容。</p>";
  }

  return String(text)
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block.trim()).replaceAll("\n", "<br />")}</p>`)
    .join("");
}

export function markdownListToItems(text) {
  if (!text) {
    return [];
  }

  return String(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").replace(/`/g, ""));
}
