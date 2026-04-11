"use client";

import { useState, useEffect, type FormEvent } from "react";

const NEGATIVE_REASONS = [
  { id: "story_not_engaging", label: "故事不好看" },
  { id: "character_wrong", label: "人物不像 / 情绪不对" },
  { id: "chinese_too_hard", label: "中文太难" },
  { id: "comic_confusing", label: "漫画看不懂" },
  { id: "image_quality", label: "图片质量有问题" },
  { id: "other", label: "其他" },
] as const;

const CACHE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type Props = {
  mode: "text" | "comic";
  passagePath: { bookId: string; chapterId: string; passageId: string };
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
  reason: string,
  detail?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/passage-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...passagePath, mode, reason, detail }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error || "提交失败，请稍后再试。" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "网络错误，请稍后再试。" };
  }
}

function cacheSubmit(path: Props["passagePath"], mode: string) {
  try {
    localStorage.setItem(cacheKey(path, mode), String(Date.now() + CACHE_MS));
  } catch {}
}

export function PassageFeedback({ mode, passagePath }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [selectedReason, setSelectedReason] = useState("");
  const [detail, setDetail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isCached(passagePath, mode)) {
      setStatus("success");
    }
  }, [passagePath, mode]);

  async function handleLike() {
    setStatus("submitting");
    const result = await submitFeedback(passagePath, mode, "liked");
    if (result.ok) {
      cacheSubmit(passagePath, mode);
      setStatus("success");
    } else {
      setErrorMessage(result.error || "提交失败。");
      setStatus("error");
    }
  }

  function handleExpand() {
    setStatus("expanded");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedReason) {
      setErrorMessage("请选择一个问题。");
      return;
    }

    setStatus("submitting");
    const detailValue = selectedReason === "other" ? detail.trim() : undefined;
    const result = await submitFeedback(passagePath, mode, selectedReason, detailValue);
    if (result.ok) {
      cacheSubmit(passagePath, mode);
      setStatus("success");
    } else {
      setErrorMessage(result.error || "提交失败。");
      setStatus("error");
    }
  }

  return (
    <div className="passage-feedback">
      <p className="passage-feedback-disclosure">
        本文和漫画由 AI 辅助生成，并经过编辑流程整理。
      </p>

      {status === "idle" && (
        <div className="passage-feedback-actions">
          <button
            type="button"
            className="passage-feedback-like"
            onClick={handleLike}
          >
            赞一下
          </button>
          <button
            type="button"
            className="passage-feedback-toggle"
            onClick={handleExpand}
          >
            有问题？告诉我们
          </button>
        </div>
      )}

      {status === "expanded" || status === "submitting" || status === "error" ? (
        <form onSubmit={handleSubmit} noValidate>
          <p className="passage-feedback-prompt">你觉得哪里有问题？</p>
          <div className="passage-feedback-reasons">
            {NEGATIVE_REASONS.map((r) => (
              <label
                key={r.id}
                className={`passage-feedback-reason ${selectedReason === r.id ? "passage-feedback-reason-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.id}
                  checked={selectedReason === r.id}
                  onChange={() => { setSelectedReason(r.id); if (r.id !== "other") setDetail(""); }}
                  className="visually-hidden"
                />
                {r.label}
              </label>
            ))}
          </div>

          {selectedReason === "other" && (
            <textarea
              className="passage-feedback-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="请描述一下具体问题…"
              rows={2}
            />
          )}

          <button
            type="submit"
            className="button-link button-link-secondary passage-feedback-submit"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "提交中…" : "提交反馈"}
          </button>

          {errorMessage && (
            <p className="passage-feedback-error">{errorMessage}</p>
          )}
        </form>
      ) : null}

      {status === "success" && (
        <p className="passage-feedback-success">感谢反馈！</p>
      )}
    </div>
  );
}
