"use client";

import { useState, useEffect, type FormEvent } from "react";
import { getDictionary } from "@/i18n";
import { trackEvent } from "@/lib/client/analytics";
import type { Locale } from "@/lib/types";

const CACHE_KEY = "future-books-submitted";
const CACHE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const BOOK_IDS = ["xiyouji", "shuihu", "hongloumeng", "jinpingmei"] as const;

type Status = "idle" | "submitting" | "success" | "error";

function isCached(): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    return Date.now() < Number(raw);
  } catch {
    return false;
  }
}

export function FutureBookForm({ locale = "zh" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  const [visible, setVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isCached()) setVisible(true);
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedBook) {
      setErrorMessage(t.futureBooks.selectBook);
      return;
    }

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMessage(t.futureBooks.invalidEmail);
      return;
    }

    setStatus("submitting");

    const form = e.currentTarget;
    const honeypot = (form.elements.namedItem("website") as HTMLInputElement)?.value;

    try {
      const res = await fetch("/api/future-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: selectedBook, email: trimmed, website: honeypot }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setErrorMessage(data.error || t.futureBooks.submitError);
        setStatus("error");
        return;
      }

      try {
        localStorage.setItem(CACHE_KEY, String(Date.now() + CACHE_MS));
      } catch {}

      trackEvent("future_book_interest_submit", {
        locale,
        book_id: selectedBook,
      });
      setStatus("success");
    } catch {
      setErrorMessage(t.futureBooks.networkError);
      setStatus("error");
    }
  }

  if (!visible && status !== "success") return null;

  if (status === "success") {
    return (
      <article className="reader-card future-books-card">
        <p className="future-books-success-text">
          {t.futureBooks.success}
        </p>
      </article>
    );
  }

  return (
    <article className="reader-card future-books-card">
      <div>
        <h2 className="passage-title">{t.futureBooks.title}</h2>
        <p className="body-copy">{t.futureBooks.description}</p>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <p className="future-books-prompt">{t.futureBooks.prompt}</p>

        <div className="book-option-grid">
          {BOOK_IDS.map((id) => (
            <label
              key={id}
              className={`book-option-label ${selectedBook === id ? "book-option-selected" : ""}`}
            >
              <input
                type="radio"
                name="book"
                value={id}
                checked={selectedBook === id}
                onChange={() => setSelectedBook(id)}
                className="book-option-input"
              />
              {t.futureBooks.books[id]}
            </label>
          ))}
        </div>

        <div className="future-books-email-row">
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="future-books-email-input"
            autoComplete="email"
          />
          <button
            type="submit"
            className="button-link button-link-secondary future-books-submit"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? t.common.submitting : t.futureBooks.notify}
          </button>
        </div>

        {/* Honeypot — hidden from real users */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="visually-hidden"
          aria-hidden="true"
        />

        {errorMessage && (
          <p className="future-books-error">{errorMessage}</p>
        )}

        <p className="future-books-privacy">
          {t.futureBooks.privacy}
        </p>
      </form>
    </article>
  );
}
