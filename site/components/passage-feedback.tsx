"use client";

import { useState, useEffect, type FormEvent } from "react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";

const ZH_REASON_IDS = [
  "story_not_engaging",
  "character_wrong",
  "chinese_too_hard",
  "comic_confusing",
  "image_quality",
  "other",
] as const;

const EN_REASON_IDS = [
  "story_not_engaging",
  "character_wrong",
  "clarity",
  "naturalness",
  "culture_fit",
  "name_confusion",
  "story_flow",
  "comic_confusing",
  "image_quality",
  "other",
] as const;

const CACHE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type Props = {
  mode: "text" | "comic";
  passagePath: { bookId: string; chapterId: string; passageId: string };
  locale?: Locale;
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
      const data = (await res.json()) as { error?: string };
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

export function PassageFeedback({ mode, passagePath, locale = "zh" }: Props) {
  const t = getDictionary(locale);
  const reasonIds = locale === "en" ? EN_REASON_IDS : ZH_REASON_IDS;

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
    if (error === "network") return t.feedback.networkError;
    return error || t.feedback.submitError;
  }

  function toggleReason(id: string) {
    setSelectedReasons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
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
      setErrorMessage(t.feedback.selectReason);
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
        {t.feedback.disclosure}
      </p>

      {status === "idle" && (
        <div className="passage-feedback-actions">
          <button
            type="button"
            className="passage-feedback-like"
            onClick={handleLike}
          >
            {t.feedback.like}
          </button>
          <button
            type="button"
            className="passage-feedback-toggle"
            onClick={handleExpand}
          >
            {t.feedback.report}
          </button>
        </div>
      )}

      {status === "expanded" || status === "submitting" || status === "error" ? (
        <form onSubmit={handleSubmit} noValidate>
          <p className="passage-feedback-prompt">{t.feedback.prompt}</p>
          <div className="passage-feedback-reasons">
            {reasonIds.map((id) => (
              <label
                key={id}
                className={`passage-feedback-reason ${selectedReasons.has(id) ? "passage-feedback-reason-selected" : ""}`}
              >
                <input
                  type="checkbox"
                  name="reasons"
                  value={id}
                  checked={selectedReasons.has(id)}
                  onChange={() => toggleReason(id)}
                  className="visually-hidden"
                />
                {t.feedback.reasons[id as keyof typeof t.feedback.reasons]}
              </label>
            ))}
          </div>

          {selectedReasons.has("other") && (
            <textarea
              className="passage-feedback-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={t.feedback.placeholder}
              rows={2}
            />
          )}

          <button
            type="submit"
            className="button-link button-link-secondary passage-feedback-submit"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? t.common.submitting : t.feedback.submit}
          </button>

          {errorMessage && (
            <p className="passage-feedback-error">{errorMessage}</p>
          )}
        </form>
      ) : null}

      {status === "success" && (
        <p className="passage-feedback-success">{t.feedback.success}</p>
      )}
    </div>
  );
}
