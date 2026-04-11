"use client";

import { useState, type FormEvent } from "react";

const BOOKS = [
  { id: "xiyouji", label: "西游记" },
  { id: "shuihu", label: "水浒传" },
  { id: "hongloumeng", label: "红楼梦" },
  { id: "jinpingmei", label: "金瓶梅" },
] as const;

type Status = "idle" | "submitting" | "success" | "error";

export function FutureBookForm() {
  const [selectedBook, setSelectedBook] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedBook) {
      setErrorMessage("请选择一本书。");
      return;
    }

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMessage("请输入有效的邮箱地址。");
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
        const data = await res.json();
        setErrorMessage(data.error || "提交失败，请稍后再试。");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMessage("网络错误，请稍后再试。");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="future-books-card future-books-success">
        <p className="future-books-success-text">
          收到了！我们会在你选的书可读时通知你。
        </p>
      </div>
    );
  }

  return (
    <form
      className="future-books-card"
      onSubmit={handleSubmit}
      noValidate
    >
      <p className="future-books-prompt">你最想读哪一本？</p>

      <div className="book-option-grid">
        {BOOKS.map((book) => (
          <label
            key={book.id}
            className={`book-option-label ${selectedBook === book.id ? "book-option-selected" : ""}`}
          >
            <input
              type="radio"
              name="book"
              value={book.id}
              checked={selectedBook === book.id}
              onChange={() => setSelectedBook(book.id)}
              className="book-option-input"
            />
            {book.label}
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
          className="button-link button-link-accent future-books-submit"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "提交中…" : "通知我"}
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
        我们只会在这本书可读时通知你。
      </p>
    </form>
  );
}
