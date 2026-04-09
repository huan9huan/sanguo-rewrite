import Link from "next/link";
import { ModeHeader } from "@/components/mode-header";
import { getSiteData } from "@/lib/content";

function getPassageTeaser(text: string) {
  const cleaned = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .find((line) => !line.startsWith("#"));

  if (!cleaned) {
    return "";
  }

  const sentence = cleaned.match(/^.+?[。！？!?]/)?.[0] ?? cleaned;
  return sentence.length > 56 ? `${sentence.slice(0, 56).trim()}...` : sentence;
}

export default async function ReadIndexPage() {
  const data = await getSiteData();

  return (
    <main className="page-shell reader-page">
      <ModeHeader />

      <section className="section">
        <div className="container section-head">
          <div>
            <h1 className="section-title">《三国演义》</h1>
          </div>
        </div>
      </section>

      {data.chapters.map((chapter) => (
        <section className="section" key={chapter.id}>
          <div className="container chapter-shell">
            <div className="chapter-banner">
              <div>
                <h2 className="chapter-title">{chapter.adapted_title_cn || chapter.source_title}</h2>
              </div>
              <div className="meta-chip">{chapter.passages.length} 节</div>
            </div>

            <div className="reader-stack">
              {chapter.passages.map((passage) => {
                const teaser = getPassageTeaser(passage.reading_text || passage.approved_cn.text || passage.draft.text);
                return (
                  <article className="reader-card" key={passage.id}>
                    <h3 className="passage-title">{passage.title}</h3>
                    {teaser ? <p className="body-copy">{teaser}</p> : null}
                    <div className="reader-card-actions">
                      <Link className="button-link button-link-accent" href={`/read/${passage.id}`}>
                        开始阅读
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
