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
            <p className="eyebrow">Story Rewrite Studio</p>
            <h1 className="site-title">Sanguo Rewrite</h1>
          </div>
          <nav className="mode-nav">
            <Link className="mode-link" href="/reader">
              阅读者模式
            </Link>
            <Link className="mode-link mode-link-accent" href="/creator">
              创作者模式
            </Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <article className="hero-card">
            <p className="eyebrow">What This Is</p>
            <h2 className="hero-title">Read the draft. Then step into the studio behind it.</h2>
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
            <p className="eyebrow eyebrow-dark">Current State</p>
            <h2 className="panel-title">A living rewrite, passage by passage.</h2>
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
            <p className="eyebrow">Reader Mode</p>
            <h3 className="card-title">For people who want to enter the story first.</h3>
            <p className="body-copy">
              Focus on passage reading, chapter flow, and emotional progression. The craft layer stays
              out of the way unless you want it.
            </p>
            <Link className="button-link" href="/reader">
              Open Reader Mode
            </Link>
          </article>

          <article className="mode-card">
            <p className="eyebrow">Creator Mode</p>
            <h3 className="card-title">For people who want the reasoning, review, and memory.</h3>
            <p className="body-copy">
              Inspect why each passage exists, what review requested, and what continuity notes are
              being carried forward.
            </p>
            <Link className="button-link button-link-accent" href="/creator">
              Open Creator Mode
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
