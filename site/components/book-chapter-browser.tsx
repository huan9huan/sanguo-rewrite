"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ChapterManifest } from "@/lib/types";
import { buildChapterHref, buildComicHref, buildPassageHref } from "@/lib/paths";

type ReadingBookmark = {
  bookId: string;
  chapterId: string;
  passageId: string;
  updatedAt: string;
};

type BookChapterBrowserProps = {
  bookId: string;
  chapters: ChapterManifest[];
};

const BOOKMARK_KEY_PREFIX = "reading-bookmark:";

function getBookmarkKey(bookId: string) {
  return `${BOOKMARK_KEY_PREFIX}${bookId}`;
}

function toChineseNumber(value: number): string {
  const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

  if (value <= 10) {
    if (value === 10) return "十";
    return digits[value] ?? String(value);
  }

  if (value < 20) {
    return `十${digits[value % 10]}`;
  }

  if (value < 100) {
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return `${digits[tens]}十${ones ? digits[ones] : ""}`;
  }

  if (value < 1000) {
    const hundreds = Math.floor(value / 100);
    const remainder = value % 100;
    if (!remainder) {
      return `${digits[hundreds]}百`;
    }
    if (remainder < 10) {
      return `${digits[hundreds]}百零${digits[remainder]}`;
    }
    return `${digits[hundreds]}百${toChineseNumber(remainder)}`;
  }

  return String(value);
}

function formatChapterTitle(chapter: ChapterManifest): string {
  const numeric = Number(chapter.id.replace(/\D/g, ""));
  if (!numeric) {
    return chapter.source_title;
  }

  return `第${toChineseNumber(numeric)}回 ${chapter.source_title}`;
}

export function BookChapterBrowser({ bookId, chapters }: BookChapterBrowserProps) {
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(chapters[0]?.id ?? null);
  const [bookmark, setBookmark] = useState<ReadingBookmark | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(getBookmarkKey(bookId));
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as ReadingBookmark;
      if (!parsed?.chapterId || !parsed?.passageId) {
        return;
      }

      setBookmark(parsed);
      setExpandedChapterId((current) => current ?? parsed.chapterId);
    } catch {
      // Ignore malformed local storage and fall back to default chapter expansion.
    }
  }, [bookId]);

  const bookmarkLabel = useMemo(() => {
    if (!bookmark) {
      return null;
    }

    const chapter = chapters.find((item) => item.id === bookmark.chapterId);
    const passage = chapter?.passages.find((item) => item.passage_id === bookmark.passageId);
    if (!chapter || !passage) {
      return null;
    }

    return {
      chapter,
      passage,
    };
  }, [bookmark, chapters]);

  return (
    <>
      {bookmarkLabel ? (
        <section className="section">
          <div className="container">
            <article className="panel bookmark-panel">
              <p className="eyebrow">阅读书签</p>
              <div className="bookmark-row">
                <div>
                  <h2 className="panel-title">继续上次阅读</h2>
                  <p className="body-copy">
                    {bookmarkLabel.passage.title}
                  </p>
                </div>
                <Link
                  className="button-link button-link-accent"
                  href={buildPassageHref({
                    bookId,
                    chapterId: bookmarkLabel.chapter.id,
                    passageId: bookmarkLabel.passage.passage_id,
                  })}
                >
                  继续阅读
                </Link>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {chapters.map((chapter) => {
        const isExpanded = expandedChapterId === chapter.id;

        return (
          <section className="section" key={chapter.id}>
            <div className="container chapter-shell">
              <article className={`chapter-card ${isExpanded ? "chapter-card-expanded" : ""}`}>
                <button
                  type="button"
                  className="chapter-banner chapter-banner-button"
                  onClick={() => setExpandedChapterId((current) => (current === chapter.id ? null : chapter.id))}
                  aria-expanded={isExpanded}
                >
                  <div className="chapter-banner-copy">
                    <p className="eyebrow">章节</p>
                    <h2 className="chapter-title">{formatChapterTitle(chapter)}</h2>
                    <p className="section-copy">{chapter.goal_cn}</p>
                  </div>
                  <div className="reader-card-actions">
                    <span className="meta-chip">{chapter.passage_count} 节</span>
                    <span className={`chapter-toggle-icon ${isExpanded ? "chapter-toggle-icon-open" : ""}`} aria-hidden="true" />
                    <span className="visually-hidden">{isExpanded ? "收起章节" : "展开章节"}</span>
                  </div>
                </button>

                {isExpanded ? (
                  <div className="chapter-expand-body">
                    <div className="chapter-expand-actions">
                      <Link className="button-link" href={buildChapterHref(bookId, chapter.id)}>
                        进入章节页
                      </Link>
                    </div>
                    <div className="chapter-passage-grid">
                      {chapter.passages.map((passage) => {
                        return (
                          <article className="reader-card chapter-passage-card" key={passage.id}>
                            <h3 className="passage-title">{passage.title}</h3>
                            {passage.teaser ? <p className="body-copy">{passage.teaser}</p> : null}
                            <div className="reader-card-actions">
                              <Link
                                className="button-link button-link-secondary"
                                href={buildPassageHref({ bookId, chapterId: chapter.id, passageId: passage.passage_id })}
                              >
                                正文
                              </Link>
                              <Link
                                className="button-link button-link-secondary"
                                href={buildComicHref({ bookId, chapterId: chapter.id, passageId: passage.passage_id })}
                              >
                                漫画
                              </Link>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </article>
            </div>
          </section>
        );
      })}
    </>
  );
}
