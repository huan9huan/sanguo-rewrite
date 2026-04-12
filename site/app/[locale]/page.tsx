import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/types";

const VALID_LOCALES: Locale[] = ["zh", "en"];

type LocaleHomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return VALID_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleHomePage({ params }: LocaleHomePageProps) {
  const { locale } = await params;
  const safeLocale = VALID_LOCALES.includes(locale as Locale) ? (locale as Locale) : "zh";
  const t = getDictionary(safeLocale);

  return (
    <div className="page-shell home-hero-page">
      <main>
        <section className="home-hero">
          <div className="container home-hero-inner">
            <h1 className="home-hero-title">{t.landing.heroTitle}</h1>
            <div className="home-hero-actions">
              <Link className="button-link button-link-accent home-hero-cta" href={`/${safeLocale}/read`}>
                {t.landing.cta}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale={safeLocale} />
    </div>
  );
}
