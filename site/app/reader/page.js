import { ModeHeader } from "@/components/mode-header";
import { ReaderPassageCard } from "@/components/reader-passage-card";
import { getSiteData } from "@/lib/content";

export default async function ReaderPage() {
  const data = await getSiteData();

  return (
    <main className="page-shell">
      <ModeHeader mode="reader" />

      <section className="section">
        <div className="container section-head">
          <div>
            <p className="eyebrow">Reader Mode</p>
            <h1 className="section-title">Read the rewrite as a living manuscript.</h1>
            <p className="section-copy">
              This mode keeps the focus on story flow, passage atmosphere, and chapter momentum.
            </p>
          </div>
        </div>
      </section>

      {data.chapters.map((chapter) => (
        <section className="section" key={chapter.id}>
          <div className="container chapter-shell">
            <div className="chapter-banner">
              <div>
                <p className="eyebrow">Chapter {chapter.id.toUpperCase()}</p>
                <h2 className="chapter-title">{chapter.adapted_title_cn || chapter.source_title}</h2>
                <p className="section-copy">{chapter.goal_cn}</p>
              </div>
              <div className="meta-chip">{chapter.passages.length} passages</div>
            </div>

            <div className="reader-stack">
              {chapter.passages.map((passage) => (
                <ReaderPassageCard key={passage.id} passage={passage} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
