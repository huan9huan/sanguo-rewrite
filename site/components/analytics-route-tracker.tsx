"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEvent, trackPageView } from "@/lib/client/analytics";
import type { Locale } from "@/lib/types";

function deriveLocale(pathname: string, queryLocale?: string | null): Locale {
  if (queryLocale === "zh" || queryLocale === "en") return queryLocale;
  if (pathname === "/zh" || pathname.startsWith("/zh/")) return "zh";
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  return "zh";
}

function derivePathContext(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const offset = parts[0] === "zh" || parts[0] === "en" ? 1 : 0;

  if (parts.length === offset) return { pageType: "landing" as const };
  if (parts[offset] !== "read") return { pageType: "other" as const };
  if (parts.length === offset + 1) return { pageType: "read_index" as const };
  if (parts.length === offset + 2) {
    return { pageType: "book" as const, bookId: parts[offset + 1] };
  }
  if (parts.length === offset + 3) {
    return { pageType: "chapter" as const, bookId: parts[offset + 1], chapterId: parts[offset + 2] };
  }
  if (parts.length === offset + 4) {
    return { pageType: "passage" as const, bookId: parts[offset + 1], chapterId: parts[offset + 2], passageId: parts[offset + 3] };
  }
  if (parts.length === offset + 5 && parts[offset + 4] === "comic") {
    return { pageType: "comic" as const, bookId: parts[offset + 1], chapterId: parts[offset + 2], passageId: parts[offset + 3] };
  }
  return { pageType: "other" as const };
}

export function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    const queryLocale = searchParams?.get("lang");
    const locale = deriveLocale(pathname, queryLocale);
    const context = derivePathContext(pathname);

    trackPageView(path, {
      locale,
      page_type: context.pageType,
    });

    if (context.pageType === "landing") {
      trackEvent("landing_view", { locale });
    }

    if (context.pageType === "book") {
      trackEvent("book_open", { locale, book_id: context.bookId });
    }

    if (context.pageType === "chapter") {
      trackEvent("chapter_open", {
        locale,
        book_id: context.bookId,
        chapter_id: context.chapterId,
      });
    }

    if (context.pageType === "passage") {
      trackEvent("passage_open", {
        locale,
        book_id: context.bookId,
        chapter_id: context.chapterId,
        passage_id: context.passageId,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
