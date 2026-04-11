"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatChapterTitle } from "@/lib/chapter-title";
import { buildComicHref, buildPassageHref } from "@/lib/paths";

type ReadingBookmark = {
  bookId: string;
  chapterId: string;
  passageId: string;
  updatedAt: string;
};

type BookChapterBrowserProps = {
  bookId: string;
  chapters: ReaderChapter[];
};

const BOOKMARK_KEY_PREFIX = "reading-bookmark:";

export type ReaderChapter = {
  id: string;
  source_title: string;
  passages: ReaderPassage[];
};

type ReaderPassage = {
  id: string;
  passage_id: string;
  title: string;
  catchup?: string;
};

function getBookmarkKey(bookId: string) {
  return `${BOOKMARK_KEY_PREFIX}${bookId}`;
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
                    <h2 className="chapter-title">{formatChapterTitle(chapter)}</h2>
                  </div>
                  <div className="reader-card-actions">
                    <span className="chapter-meta-toggle" aria-hidden="true">
                      <span className={`chapter-toggle-icon ${isExpanded ? "chapter-toggle-icon-open" : ""}`} aria-hidden="true" />
                    </span>
                    <span className="visually-hidden">{isExpanded ? "收起章节" : "展开章节"}</span>
                  </div>
                </button>

                {isExpanded ? (
                  <div className="chapter-expand-body">
                    <div className="chapter-passage-grid">
                      {chapter.passages.map((passage) => {
                        return (
                          <article className="reader-card chapter-passage-card" key={passage.id}>
                            <h3 className="passage-title">{passage.title}</h3>
                            {passage.catchup ? <p className="body-copy">{passage.catchup}</p> : null}
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
