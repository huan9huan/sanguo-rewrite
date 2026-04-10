import Link from "next/link";

export default async function HomePage() {
  return (
    <main className="page-shell home-hero-page">
      <section className="home-hero">
        <div className="container home-hero-inner">
          <h1 className="home-hero-title">让中国经典更加生动</h1>
          <div className="home-hero-actions">
            <Link className="button-link button-link-accent home-hero-cta" href="/read">
              Start Reading 《三国演义》
            </Link>
            <Link className="button-link button-link-secondary home-hero-cta-secondary" href="/read">
              浏览章节与段落
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
