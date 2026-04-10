"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ChapterManifest } from "@/lib/types";
import { buildChapterHref, buildPassageHref } from "@/lib/paths";

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
                    {bookmarkLabel.chapter.adapted_title_cn || bookmarkLabel.chapter.source_title} ·{" "}
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
        const chapterBookmark =
          bookmark?.chapterId === chapter.id
            ? chapter.passages.find((item) => item.passage_id === bookmark.passageId) ?? null
            : null;

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
                    <h2 className="chapter-title">{chapter.adapted_title_cn || chapter.source_title}</h2>
                    <p className="section-copy">{chapter.goal_cn}</p>
                  </div>
                  <div className="reader-card-actions">
                    <span className="meta-chip">{chapter.passage_count} 节</span>
                    {chapterBookmark ? <span className="status-chip">上次读到 {chapterBookmark.title}</span> : null}
                    <span className="button-link button-link-accent">{isExpanded ? "收起" : "展开"}</span>
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
                        const isBookmarked = chapterBookmark?.passage_id === passage.passage_id;
                        return (
                          <article className={`reader-card chapter-passage-card ${isBookmarked ? "chapter-passage-card-active" : ""}`} key={passage.id}>
                            {isBookmarked ? (
                              <div className="meta-row">
                                <span className="status-chip">阅读到这里</span>
                              </div>
                            ) : null}
                            <h3 className="passage-title">{passage.title}</h3>
                            {passage.teaser ? <p className="body-copy">{passage.teaser}</p> : null}
                            <div className="reader-card-actions">
                              <Link
                                className="button-link button-link-accent"
                                href={buildPassageHref({ bookId, chapterId: chapter.id, passageId: passage.passage_id })}
                              >
                                进入正文
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
