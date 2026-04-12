import { LanguageSwitch } from "@/components/language-switch";
import type { Locale } from "@/lib/types";

type SiteFooterProps = {
  locale?: Locale;
};

export function SiteFooter({ locale = "zh" }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <span className="site-footer-trademark">
          &copy; {new Date().getFullYear()} Read Chinese Classics
        </span>
        <LanguageSwitch
          currentLocale={locale}
          availableLocales={["zh", "en"]}
          localeHrefs={{ zh: locale === "zh" ? "/" : "/zh", en: locale === "en" ? "/" : "/en" }}
        />
      </div>
    </footer>
  );
}
