import { LandingCtaLink } from "@/components/landing-cta-link";
import { SiteMark } from "@/components/site-mark";
import { SiteFooter } from "@/components/site-footer";
import { getDictionary } from "@/i18n";

export default async function HomePage() {
  const t = getDictionary("zh");

  return (
    <div className="page-shell home-hero-page">
      <main>
        <section className="home-hero">
          <div className="container home-hero-inner">
            <SiteMark className="home-site-mark" label="Read Chinese Classics" />
            <h1 className="home-hero-title">{t.landing.heroTitle}</h1>
            <div className="home-hero-actions">
              <LandingCtaLink className="button-link button-link-accent home-hero-cta" href="/read" locale="zh">
                {t.landing.cta}
              </LandingCtaLink>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale="zh" />
    </div>
  );
}
