import type { Locale } from "@/lib/types";

export const SITE_URL = "https://readchineseclassics.com";

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function localeAlternates(pathByLocale: Record<Locale, string>) {
  return {
    "zh-CN": absoluteUrl(pathByLocale.zh),
    en: absoluteUrl(pathByLocale.en),
  };
}
