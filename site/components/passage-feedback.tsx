"use client";

import { useState, useEffect, type FormEvent } from "react";

const ZH_REASONS = [
  { id: "story_not_engaging", label: "故事不好看" },
  { id: "character_wrong", label: "人物不像 / 情绪不对" },
  { id: "chinese_too_hard", label: "中文太难" },
  { id: "comic_confusing", label: "漫画看不懂" },
  { id: "image_quality", label: "图片质量有问题" },
  { id: "other", label: "其他" },
] as const;

const EN_REASONS = [
  { id: "story_not_engaging", label: "Story not engaging" },
  { id: "character_wrong", label: "Character / emotion off" },
  { id: "clarity", label: "Hard to understand" },
  { id: "naturalness", label: "Unnatural English" },
  { id: "culture_fit", label: "Culture gap / context missing" },
  { id: "name_confusion", label: "Names / terms confusing" },
  { id: "story_flow", label: "Story flow broken" },
  { id: "comic_confusing", label: "Comic confusing" },
  { id: "image_quality", label: "Image quality issue" },
  { id: "other", label: "Other" },
] as const;

const CACHE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type Props = {
  mode: "text" | "comic";
  passagePath: { bookId: string; chapterId: string; passageId: string };
  locale?: "zh" | "en";
};

type Status = "idle" | "expanded" | "submitting" | "success" | "error";

function cacheKey(path: Props["passagePath"], mode: string): string {
  return `passage-feedback-${path.bookId}-${path.chapterId}-${path.passageId}-${mode}`;
}

function isCached(path: Props["passagePath"], mode: string): boolean {
  try {
    const raw = localStorage.getItem(cacheKey(path, mode));
    if (!raw) return false;
    return Date.now() < Number(raw);
  } catch {
    return false;
  }
}

async function submitFeedback(
  passagePath: Props["passagePath"],
  mode: string,
  reasons: string[],
  detail: string | undefined,
  locale: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/passage-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...passagePath, mode, reasons, detail, locale }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "network" };
  }
}

function cacheSubmit(path: Props["passagePath"], mode: string) {
  try {
    localStorage.setItem(cacheKey(path, mode), String(Date.now() + CACHE_MS));
  } catch {}
}

const ZH_TEXT = {
  disclosure: "本文和漫画由 AI 辅助生成，并经过编辑流程整理。",
  like: "赞一下",
  report: "有问题？告诉我们",
  prompt: "你觉得哪里有问题？（可多选）",
  placeholder: "请描述一下具体问题…",
  submitting: "提交中…",
  submit: "提交反馈",
  success: "感谢反馈！",
  selectReason: "请至少选择一个问题。",
  submitError: "提交失败，请稍后再试。",
  networkError: "网络错误，请稍后再试。",
} as const;

const EN_TEXT = {
  disclosure: "Text and comics are AI-assisted and edited by humans.",
  like: "Like",
  report: "Issue? Tell us",
  prompt: "What's the problem? (pick all that apply)",
  placeholder: "Describe the issue…",
  submitting: "Submitting…",
  submit: "Submit feedback",
  success: "Thanks for your feedback!",
  selectReason: "Please select at least one issue.",
  submitError: "Submission failed. Please try again later.",
  networkError: "Network error. Please try again later.",
} as const;

export function PassageFeedback({ mode, passagePath, locale = "zh" }: Props) {
  const isEn = locale === "en";
  const t = isEn ? EN_TEXT : ZH_TEXT;
  const reasons = isEn ? EN_REASONS : ZH_REASONS;

  const [status, setStatus] = useState<Status>("idle");
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isCached(passagePath, mode)) {
      setStatus("success");
    }
  }, [passagePath, mode]);

  function resolveError(error?: string): string {
    if (error === "network") return t.networkError;
    return error || t.submitError;
  }

  function toggleReason(id: string) {
    setSelectedReasons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (id !== "other") {
          // keep detail only if "other" is still selected
        }
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleLike() {
    setStatus("submitting");
    const result = await submitFeedback(passagePath, mode, [], undefined, locale);
    if (result.ok) {
      cacheSubmit(passagePath, mode);
      setStatus("success");
    } else {
      setErrorMessage(resolveError(result.error));
      setStatus("error");
    }
  }

  function handleExpand() {
    setStatus("expanded");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    if (selectedReasons.size === 0) {
      setErrorMessage(t.selectReason);
      return;
    }

    setStatus("submitting");
    const detailValue = selectedReasons.has("other") ? detail.trim() : undefined;
    const result = await submitFeedback(passagePath, mode, [...selectedReasons], detailValue, locale);
    if (result.ok) {
      cacheSubmit(passagePath, mode);
      setStatus("success");
    } else {
      setErrorMessage(resolveError(result.error));
      setStatus("error");
    }
  }

  return (
    <div className="passage-feedback">
      <p className="passage-feedback-disclosure">
        {t.disclosure}
      </p>

      {status === "idle" && (
        <div className="passage-feedback-actions">
          <button
            type="button"
            className="passage-feedback-like"
            onClick={handleLike}
          >
            {t.like}
          </button>
          <button
            type="button"
            className="passage-feedback-toggle"
            onClick={handleExpand}
          >
            {t.report}
          </button>
        </div>
      )}

      {status === "expanded" || status === "submitting" || status === "error" ? (
        <form onSubmit={handleSubmit} noValidate>
          <p className="passage-feedback-prompt">{t.prompt}</p>
          <div className="passage-feedback-reasons">
            {reasons.map((r) => (
              <label
                key={r.id}
                className={`passage-feedback-reason ${selectedReasons.has(r.id) ? "passage-feedback-reason-selected" : ""}`}
              >
                <input
                  type="checkbox"
                  name="reasons"
                  value={r.id}
                  checked={selectedReasons.has(r.id)}
                  onChange={() => toggleReason(r.id)}
                  className="visually-hidden"
                />
                {r.label}
              </label>
            ))}
          </div>

          {selectedReasons.has("other") && (
            <textarea
              className="passage-feedback-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={t.placeholder}
              rows={2}
            />
          )}

          <button
            type="submit"
            className="button-link button-link-secondary passage-feedback-submit"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? t.submitting : t.submit}
          </button>

          {errorMessage && (
            <p className="passage-feedback-error">{errorMessage}</p>
          )}
        </form>
      ) : null}

      {status === "success" && (
        <p className="passage-feedback-success">{t.success}</p>
      )}
    </div>
  );
}
