import Link from "next/link";
import { ModeHeader } from "@/components/mode-header";
import { markdownListToItems } from "@/lib/format";
import { getSiteData } from "@/lib/content";

export default async function ReadIndexPage() {
  const data = await getSiteData();

  return (
    <main className="page-shell reader-page">
      <ModeHeader />

      <section className="section">
        <div className="container section-head">
          <div>
            <p className="eyebrow">Reading Room</p>
            <h1 className="section-title">Read passage by passage.</h1>
            <p className="section-copy">
              Start with the manuscript. Open the comic whenever you want a visual pass through the same beat.
            </p>
          </div>
        </div>
      </section>

      {data.chapters.map((chapter) => (
        <section className="section" key={chapter.id}>
          <div className="container chapter-shell">
            <div className="chapter-banner">
              <div>
                <h2 className="chapter-title">{chapter.adapted_title_cn || chapter.source_title}</h2>
                <p className="section-copy">{chapter.goal_cn}</p>
              </div>
              <div className="meta-chip">{chapter.passages.length} passages</div>
            </div>

            <div className="reader-stack">
              {chapter.passages.map((passage) => {
                const summaryItems = markdownListToItems(passage.summary_markdown).slice(0, 2);
                return (
                  <article className="reader-card" key={passage.id}>
                    <h3 className="passage-title">{passage.title}</h3>
                    {summaryItems.length ? (
                      <div className="summary-block">
                        <ul className="bullet-list">
                          {summaryItems.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="reader-card-actions">
                      <Link className="button-link button-link-accent" href={`/read/${passage.id}`}>
                        Read Passage
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
