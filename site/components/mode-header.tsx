"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ModeHeaderProps = {
  chapterLabel?: string;
  passageLabel?: string;
  compactTitle?: string;
};

export function ModeHeader({
  chapterLabel,
  passageLabel,
  compactTitle,
}: ModeHeaderProps) {
  const [isCompressed, setIsCompressed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsCompressed((current) => {
        if (current) {
          return window.scrollY > 28;
        }

        return window.scrollY > 72;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const title = compactTitle || "三国演义";

  return (
    <header className={`site-header ${isCompressed ? "site-header-compressed" : ""}`}>
      <div className="container header-row">
        <div className="header-copy">
          {!isCompressed ? (
            <>
              <div>
                <Link href="/" className="site-title">
                  三国演义
                </Link>
              </div>
              {chapterLabel || passageLabel ? (
                <p className="header-context">
                  {chapterLabel ? <span>{chapterLabel}</span> : null}
                  {chapterLabel && passageLabel ? <span className="header-context-sep">/</span> : null}
                  {passageLabel ? <span>{passageLabel}</span> : null}
                </p>
              ) : null}
            </>
          ) : (
            <Link href="/" className="sticky-passage-title">
              {title}
            </Link>
          )}
        </div>

        <nav className="mode-nav">
          {!isCompressed ? (
            <>
              <Link className="mode-link" href="/">
                Home
              </Link>
              <Link className="mode-link" href="/read">
                全部章节
              </Link>
            </>
          ) : (
            <Link className="mode-link" href="/read">
              全部章节
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
