"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";
import { SiteMark } from "@/components/site-mark";

function TextIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function ComicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

type ModeHeaderProps = {
  logoHref?: string;
  chapterLabel?: string;
  passageLabel?: string;
  compactTitle?: string;
  bookLabel?: string;
  breadcrumbLinks?: Array<{
    label: string;
    href: string;
  }>;
  primaryLink?: {
    label: string;
    href: string;
  };
  secondaryLink?: {
    label: string;
    href: string;
  };
  actionLink?: {
    label: string;
    href: string;
    prefetch?: boolean;
  };
  locale?: Locale;
};

export function ModeHeader({
  logoHref,
  chapterLabel,
  passageLabel,
  compactTitle,
  bookLabel,
  breadcrumbLinks,
  primaryLink,
  secondaryLink,
  actionLink,
  locale = "zh",
}: ModeHeaderProps) {
  const t = getDictionary(locale);
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

  const title =
    [chapterLabel, passageLabel].filter(Boolean).join(" / ") ||
    breadcrumbLinks?.[breadcrumbLinks.length - 1]?.label ||
    primaryLink?.label ||
    compactTitle ||
    "三国演义";
  const isPassageHeader = Boolean(passageLabel && chapterLabel);

  return (
    <header className={`site-header ${isCompressed ? "site-header-compressed" : ""} ${actionLink ? "site-header-with-action" : ""}`}>
      <div className="container header-row">
        <div className={`header-brand ${isPassageHeader ? "header-brand-passage" : ""}`}>
          <Link href={logoHref || "/read"} prefetch={false} className="header-brand-mark" aria-label="All books">
            <SiteMark label={bookLabel || primaryLink?.label || "Read Chinese Classics"} />
          </Link>
          <div className="header-copy">
            {!isCompressed ? (
              isPassageHeader ? (
                <>
                  <div className="header-meta-trail">
                    <Link href={primaryLink?.href || "/"} prefetch={false} className="header-subtitle-link">
                      {bookLabel || primaryLink?.label || "三国演义"}
                    </Link>
                    {secondaryLink ? (
                      <>
                        <span className="header-meta-sep">/</span>
                        <Link href={secondaryLink.href} prefetch={false} className="header-subtitle-link">
                          {chapterLabel}
                        </Link>
                      </>
                    ) : null}
                  </div>
                  <div>
                    <p className="site-title header-passage-title">{passageLabel}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Link href={primaryLink?.href || "/"} prefetch={false} className="header-subtitle-link">
                      {bookLabel || primaryLink?.label || "三国演义"}
                    </Link>
                  </div>
                  {chapterLabel ? (
                    <div>
                      {secondaryLink ? (
                        <Link href={secondaryLink.href} prefetch={false} className="site-title">
                          {chapterLabel}
                        </Link>
                      ) : (
                        <p className="site-title">{chapterLabel}</p>
                      )}
                    </div>
                  ) : null}
                  {passageLabel ? (
                    <p className="header-context header-context-subtitle">
                      <span>{passageLabel}</span>
                    </p>
                  ) : null}
                </>
              )
            ) : isPassageHeader ? (
              <div className="sticky-passage-inline">
                {secondaryLink ? (
                  <Link href={secondaryLink.href} prefetch={false} className="sticky-passage-link">
                    {chapterLabel}
                  </Link>
                ) : (
                  <span className="sticky-passage-link">{chapterLabel}</span>
                )}
                <span className="sticky-passage-sep">/</span>
                <span className="sticky-passage-current">{passageLabel}</span>
              </div>
            ) : (
              <Link href={secondaryLink?.href || primaryLink?.href || "/"} prefetch={false} className="sticky-passage-title">
                {title}
              </Link>
            )}
          </div>
        </div>

        <nav className="mode-nav">
          {actionLink ? (
            <Link
              className="mode-link mode-link-icon"
              href={actionLink.href}
              prefetch={actionLink.prefetch}
              title={actionLink.label}
            >
              {actionLink.label === t.common.comic ? <ComicIcon /> : <TextIcon />}
            </Link>
          ) : secondaryLink ? (
            <Link className="mode-link" href={secondaryLink.href} prefetch={false}>
              {secondaryLink.label}
            </Link>
          ) : !isCompressed ? (
            <>
              <Link className="mode-link" href="/" prefetch={false}>
                {t.common.home}
              </Link>
              <Link className="mode-link" href="/read" prefetch={false}>
                {t.common.library}
              </Link>
            </>
          ) : (
            <Link className="mode-link" href="/read" prefetch={false}>
              {t.common.allBooks}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
