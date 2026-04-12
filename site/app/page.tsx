import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { getDictionary } from "@/i18n";

export default async function HomePage() {
  const t = getDictionary("zh");

  return (
    <div className="page-shell home-hero-page">
      <main>
        <section className="home-hero">
          <div className="container home-hero-inner">
            <h1 className="home-hero-title">{t.landing.heroTitle}</h1>
            <div className="home-hero-actions">
              <Link className="button-link button-link-accent home-hero-cta" href="/read">
                {t.landing.cta}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale="zh" />
    </div>
  );
}
