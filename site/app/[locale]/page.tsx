import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo-landing-page";
import { absoluteUrl, localeAlternates } from "@/lib/seo";
import type { Locale } from "@/lib/types";

const VALID_LOCALES: Locale[] = ["zh", "en"];

type LocaleHomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return VALID_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleHomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = VALID_LOCALES.includes(locale as Locale) ? (locale as Locale) : "zh";
  const isEn = safeLocale === "en";
  const title = isEn
    ? "Read Romance of the Three Kingdoms | Story-First Chinese Classics"
    : "阅读三国演义 | 更好读的中国经典";
  const description = isEn
    ? "Read Romance of the Three Kingdoms as a story-first Chinese classic, rewritten passage by passage with text, comics, and English adaptation."
    : "阅读更好读的《三国演义》：按段落打磨的中国经典重写，有正文、漫画和英文版本。";
  const path = `/${safeLocale}`;

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(path),
      languages: localeAlternates({ zh: "/zh", en: "/en" }),
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: "Read Chinese Classics",
      locale: isEn ? "en_US" : "zh_CN",
      type: "website",
    },
  };
}

export default async function LocaleHomePage({ params }: LocaleHomePageProps) {
  const { locale } = await params;
  const safeLocale = VALID_LOCALES.includes(locale as Locale) ? (locale as Locale) : "zh";

  return <SeoLandingPage locale={safeLocale} />;
}
