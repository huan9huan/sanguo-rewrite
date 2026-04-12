"use client";

import Link from "next/link";
import type { Locale } from "@/lib/types";

type LanguageSwitchProps = {
  currentLocale: Locale;
  availableLocales: Locale[];
  localeHrefs: Record<Locale, string>;
};

const localeLabels: Record<Locale, string> = {
  zh: "中文",
  en: "EN",
};

export function LanguageSwitch({ currentLocale, availableLocales, localeHrefs }: LanguageSwitchProps) {
  return (
    <nav className="language-switch" aria-label="Language">
      {(Object.keys(localeLabels) as Locale[]).map((locale) => {
        const isAvailable = availableLocales.includes(locale);
        const isCurrent = locale === currentLocale;

        if (isCurrent) {
          return (
            <span key={locale} className="language-switch-item language-switch-active" aria-current="true">
              {localeLabels[locale]}
            </span>
          );
        }

        if (!isAvailable) {
          return (
            <span key={locale} className="language-switch-item language-switch-unavailable" aria-disabled="true">
              {localeLabels[locale]}
            </span>
          );
        }

        return (
          <Link
            key={locale}
            className="language-switch-item language-switch-link"
            href={localeHrefs[locale]}
            lang={locale}
          >
            {localeLabels[locale]}
          </Link>
        );
      })}
    </nav>
  );
}
