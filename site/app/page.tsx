import type { Metadata } from "next";
import { headers } from "next/headers";
import { SeoLandingPage } from "@/components/seo-landing-page";
import type { Locale } from "@/lib/types";

export const metadata: Metadata = {
  title: "Read Chinese Classics",
  description: "A story-first reading project for Chinese classics, starting with Romance of the Three Kingdoms.",
};

type HomePageProps = {
  searchParams: Promise<{ lang?: string }>;
};

function pickLocale(langParam: string | undefined, acceptLanguage: string): Locale {
  if (langParam === "zh" || langParam === "en") {
    return langParam;
  }

  return /\bzh\b|zh-cn|zh-tw|zh-hk|zh-mo|zh-sg/i.test(acceptLanguage) ? "zh" : "en";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const headerStore = await headers();
  const locale = pickLocale(params.lang, headerStore.get("accept-language") ?? "");

  return <SeoLandingPage locale={locale} preserveHomepagePath />;
}
