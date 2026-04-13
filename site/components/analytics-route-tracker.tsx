"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/client/analytics";
import type { Locale } from "@/lib/types";

function deriveLocale(pathname: string): Locale {
  if (pathname === "/zh" || pathname.startsWith("/zh/")) return "zh";
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  return "zh";
}

function derivePageType(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const offset = parts[0] === "zh" || parts[0] === "en" ? 1 : 0;

  if (parts.length === offset) return "landing";
  if (parts[offset] !== "read") return "other";
  if (parts.length === offset + 1) return "read_index";
  if (parts.length === offset + 2) return "book";
  if (parts.length === offset + 3) return "chapter";
  if (parts.length === offset + 4) return "passage";
  if (parts.length === offset + 5 && parts[offset + 4] === "comic") return "comic";
  return "other";
}

export function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;

    trackPageView(path, {
      locale: deriveLocale(pathname),
      page_type: derivePageType(pathname),
    });
  }, [pathname, searchParams]);

  return null;
}
