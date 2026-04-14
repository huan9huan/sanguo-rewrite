import type { Metadata } from "next";
import Link from "next/link";
import { ModeHeader } from "@/components/mode-header";
import { SiteFooter } from "@/components/site-footer";
import { getDictionary } from "@/i18n";
import { buildLibraryHref } from "@/lib/paths";
import type { Locale } from "@/lib/types";

const VALID_LOCALES: Locale[] = ["zh", "en"];
const SITE_URL = "https://readchineseclassics.com";

type LocaleAboutPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return VALID_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleAboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = VALID_LOCALES.includes(locale as Locale) ? (locale as Locale) : "zh";
  const isEn = safeLocale === "en";
  const title = isEn
    ? "About Read Chinese Classics | Story-First Chinese Classics"
    : "关于 Read Chinese Classics | 中国经典阅读项目";
  const description = isEn
    ? "Why this Chinese classics reading project exists, why it starts with Romance of the Three Kingdoms, and how the editorial workflow works."
    : "了解这个中国经典阅读项目为什么存在、为什么先从《三国演义》开始，以及内容是如何一步步制作出来的。";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${safeLocale}/about`,
      languages: {
        "zh-CN": `${SITE_URL}/zh/about`,
        en: `${SITE_URL}/en/about`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${safeLocale}/about`,
      siteName: "Read Chinese Classics",
      locale: isEn ? "en_US" : "zh_CN",
      type: "website",
    },
  };
}

export default async function LocaleAboutPage({ params }: LocaleAboutPageProps) {
  const { locale } = await params;
  const safeLocale = VALID_LOCALES.includes(locale as Locale) ? (locale as Locale) : "zh";
  const t = getDictionary(safeLocale);

  return (
    <div className="page-shell reader-page">
      <main>
        <ModeHeader
          compactTitle={t.about.pageTitle}
          bookLabel={t.about.pageTitle}
          locale={safeLocale}
          logoHref={buildLibraryHref(safeLocale)}
        />

        <section className="section about-hero-section">
          <div className="container about-hero-grid">
            <div>
              <p className="eyebrow">{t.about.eyebrow}</p>
              <h1 className="section-title about-page-title">{t.about.heroTitle}</h1>
            </div>
            <p className="section-copy about-hero-copy">{t.about.heroCopy}</p>
          </div>
        </section>

        <section className="section">
          <div className="container about-grid">
            <article className="reader-card about-card">
              <h2 className="subsection-title about-card-title">{t.about.whyTitle}</h2>
              <p className="body-copy">{t.about.whyCopy}</p>
            </article>
            <article className="reader-card about-card">
              <h2 className="subsection-title about-card-title">{t.about.whySanguoTitle}</h2>
              <p className="body-copy">{t.about.whySanguoCopy}</p>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="container about-process-shell">
            <div className="section-head">
              <div>
                <p className="eyebrow">{t.about.processEyebrow}</p>
                <h2 className="section-title about-section-title">{t.about.processTitle}</h2>
              </div>
            </div>
            <ol className="about-process-list">
              {t.about.processSteps.map((step) => (
                <li key={step.title}>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section">
          <div className="container about-grid">
            <article className="reader-card about-card">
              <h2 className="subsection-title about-card-title">{t.about.standardsTitle}</h2>
              <ul className="about-bullet-list">
                {t.about.standards.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="reader-card about-card">
              <h2 className="subsection-title about-card-title">{t.about.aiTitle}</h2>
              <p className="body-copy">{t.about.aiCopy}</p>
              <h2 className="subsection-title about-card-title about-card-subtitle">{t.about.statusTitle}</h2>
              <p className="body-copy">{t.about.statusCopy}</p>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="reader-card about-cta-card">
              <p className="eyebrow">{t.about.ctaEyebrow}</p>
              <h2 className="section-title about-section-title">{t.about.ctaTitle}</h2>
              <p className="section-copy">{t.about.ctaCopy}</p>
              <Link className="button-link button-link-accent" href={buildLibraryHref(safeLocale)} prefetch={false}>
                {t.about.ctaButton}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale={safeLocale} localeHrefs={{ zh: "/zh/about", en: "/en/about" }} />
    </div>
  );
}
