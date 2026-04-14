import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/seo-landing-page";

const SITE_URL = "https://readchineseclassics.com";

export const metadata: Metadata = {
  title: "阅读三国演义 | 更好读的中国经典",
  description: "阅读更好读的《三国演义》：按段落打磨的中国经典重写，有正文、漫画和英文版本。",
  alternates: {
    canonical: `${SITE_URL}/zh`,
    languages: {
      "zh-CN": `${SITE_URL}/zh`,
      en: `${SITE_URL}/en`,
    },
  },
  openGraph: {
    title: "阅读三国演义 | 更好读的中国经典",
    description: "阅读更好读的《三国演义》：按段落打磨的中国经典重写，有正文、漫画和英文版本。",
    url: `${SITE_URL}/zh`,
    siteName: "Read Chinese Classics",
    locale: "zh_CN",
    type: "website",
  },
};

export default async function HomePage() {
  return <SeoLandingPage locale="zh" />;
}
