import Link from "next/link";
import { LanguageSwitch } from "@/components/language-switch";
import { SiteMark } from "@/components/site-mark";
import { getDictionary } from "@/i18n";
import { buildAboutHref } from "@/lib/paths";
import type { Locale } from "@/lib/types";

type SiteFooterProps = {
  locale?: Locale;
  preserveHomepagePath?: boolean;
  localeHrefs?: Record<Locale, string>;
};

export function SiteFooter({ locale = "zh", preserveHomepagePath = false, localeHrefs }: SiteFooterProps) {
  const t = getDictionary(locale);
  const resolvedLocaleHrefs = localeHrefs ?? (preserveHomepagePath
    ? { zh: "/?lang=zh", en: "/?lang=en" }
    : { zh: locale === "zh" ? "/" : "/zh", en: locale === "en" ? "/" : "/en" });

  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="site-footer-brand">
          <SiteMark className="site-footer-mark" label="Read Chinese Classics" />
          <div className="site-footer-meta">
            <span className="site-footer-trademark">
              &copy; {new Date().getFullYear()} Read Chinese Classics
            </span>
            <Link className="site-footer-link" href={buildAboutHref(locale)} prefetch={false}>
              {t.common.about}
            </Link>
          </div>
        </div>
        <LanguageSwitch
          currentLocale={locale}
          availableLocales={["zh", "en"]}
          localeHrefs={resolvedLocaleHrefs}
        />
      </div>
    </footer>
  );
}
