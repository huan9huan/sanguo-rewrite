import { LanguageSwitch } from "@/components/language-switch";
import { SiteMark } from "@/components/site-mark";
import type { Locale } from "@/lib/types";

type SiteFooterProps = {
  locale?: Locale;
};

export function SiteFooter({ locale = "zh" }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="site-footer-brand">
          <SiteMark className="site-footer-mark" label="Read Chinese Classics" />
          <span className="site-footer-trademark">
            &copy; {new Date().getFullYear()} Read Chinese Classics
          </span>
        </div>
        <LanguageSwitch
          currentLocale={locale}
          availableLocales={["zh", "en"]}
          localeHrefs={{ zh: locale === "zh" ? "/" : "/zh", en: locale === "en" ? "/" : "/en" }}
        />
      </div>
    </footer>
  );
}
