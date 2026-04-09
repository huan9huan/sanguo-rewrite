import Link from "next/link";
import { getSiteData } from "@/lib/content";

export default async function HomePage() {
  const data = await getSiteData();
  const stats = data.project.stats;

  return (
    <main className="page-shell">
      <header className="site-header">
        <div className="container header-row">
          <div>
            <p className="eyebrow">Story Reading Room</p>
            <h1 className="site-title">Sanguo Rewrite</h1>
          </div>
          <nav className="mode-nav">
            <Link className="mode-link mode-link-accent" href="/read">
              Start Reading
            </Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <article className="hero-card">
            <p className="eyebrow">What This Is</p>
            <h2 className="hero-title">A story-first rewrite built for reading.</h2>
            <p className="hero-copy">{data.project.description}</p>
            <div className="principles">
              {data.project.principles.map((item) => (
                <span className="principle-chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </article>

          <article className="hero-card hero-card-dark">
            <p className="eyebrow eyebrow-dark">Reading Focus</p>
            <h2 className="panel-title">Passage first. Comic close at hand.</h2>
            <div className="stats-grid">
              <div className="stat-box">
                <strong>{stats.chapters}</strong>
                <span>chapter bundle</span>
              </div>
              <div className="stat-box">
                <strong>{stats.passages}</strong>
                <span>visible passages</span>
              </div>
              <div className="stat-box">
                <strong>{stats.reviews}</strong>
                <span>reviews logged</span>
              </div>
              <div className="stat-box">
                <strong>{stats.approved_cn}</strong>
                <span>approved CN outputs</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container dual-mode-grid">
          <article className="mode-card">
            <p className="eyebrow">Read</p>
            <h3 className="card-title">Enter the story through passages, with comic support when you want it.</h3>
            <p className="body-copy">
              Read the current manuscript in passage order, move scene by scene, and open each comic when you want a
              visual pass through the same moment.
            </p>
            <Link className="button-link button-link-accent" href="/read">
              Open Reading Room
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
