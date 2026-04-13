"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";

const CACHE_MS = 7 * 24 * 60 * 60 * 1000;

type FollowSubscribeTrigger = "next_chapter_unavailable" | "chapter_3_reached" | "unfinished_passage";

type Props = {
  bookId: string;
  chapterId: string;
  passageId: string;
  trigger: FollowSubscribeTrigger;
  locale?: Locale;
};

type Status = "idle" | "submitting" | "success" | "error";

function cacheKey({ bookId, chapterId, passageId, trigger }: Omit<Props, "locale">): string {
  return `follow-subscribe-${bookId}-${chapterId}-${passageId}-${trigger}`;
}

function isCached(path: Omit<Props, "locale">): boolean {
  try {
    const raw = localStorage.getItem(cacheKey(path));
    if (!raw) return false;
    return Date.now() < Number(raw);
  } catch {
    return false;
  }
}

function cacheSubmit(path: Omit<Props, "locale">) {
  try {
    localStorage.setItem(cacheKey(path), String(Date.now() + CACHE_MS));
  } catch {}
}

export function FollowSubscribeForm({
  bookId,
  chapterId,
  passageId,
  trigger,
  locale = "zh",
}: Props) {
  const t = getDictionary(locale);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isCached({ bookId, chapterId, passageId, trigger })) {
      setStatus("success");
    }
  }, [bookId, chapterId, passageId, trigger]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMessage(t.followSubscription.invalidEmail);
      return;
    }

    setStatus("submitting");
    const form = e.currentTarget;
    const honeypot = (form.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";

    try {
      const res = await fetch("/api/follow-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          chapterId,
          passageId,
          trigger,
          email: trimmed,
          locale,
          website: honeypot,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setErrorMessage(data.error || t.followSubscription.submitError);
        setStatus("error");
        return;
      }

      cacheSubmit({ bookId, chapterId, passageId, trigger });
      setStatus("success");
    } catch {
      setErrorMessage(t.followSubscription.networkError);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <article className="reader-card follow-subscribe-card follow-subscribe-success">
        <p className="follow-subscribe-success-text">{t.followSubscription.success}</p>
      </article>
    );
  }

  return (
    <article className="reader-card follow-subscribe-card">
      <div className="follow-subscribe-copy">
        <p className="eyebrow">{t.followSubscription.eyebrow}</p>
        <h2 className="passage-title">{t.followSubscription.title}</h2>
        <p className="body-copy">{t.followSubscription.description}</p>
      </div>
      <form onSubmit={handleSubmit} noValidate className="follow-subscribe-form">
        <p className="follow-subscribe-prompt">{t.followSubscription.prompt}</p>
        <div className="follow-subscribe-email-row">
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="follow-subscribe-email-input"
            autoComplete="email"
          />
          <button
            type="submit"
            className="button-link button-link-accent follow-subscribe-submit"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? t.common.submitting : t.followSubscription.notify}
          </button>
        </div>

        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="visually-hidden"
          aria-hidden="true"
        />

        {errorMessage ? <p className="follow-subscribe-error">{errorMessage}</p> : null}
        <p className="follow-subscribe-privacy">{t.followSubscription.privacy}</p>
      </form>
    </article>
  );
}
