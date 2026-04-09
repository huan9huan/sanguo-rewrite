import Link from "next/link";
import { notFound } from "next/navigation";
import { ComicImageBlock } from "@/components/comic-image-block";
import { ModeHeader } from "@/components/mode-header";
import { proseToHtml } from "@/lib/format";
import { getAllPassages, getPassageById, getSiteData } from "@/lib/content";

type PassagePageProps = {
  params: Promise<{
    passageId: string;
  }>;
};

export async function generateStaticParams() {
  const passages = await getAllPassages();
  return passages.map((passage) => ({ passageId: passage.id }));
}

export default async function PassagePage({ params }: PassagePageProps) {
  const { passageId } = await params;
  const passage = await getPassageById(passageId);

  if (!passage) {
    notFound();
  }

  const data = await getSiteData();
  const chapter = data.chapters.find((item) => item.id === passage.chapter_id);
  const passages = await getAllPassages();
  const currentIndex = passages.findIndex((item) => item.id === passage.id);
  const previousPassage = currentIndex > 0 ? passages[currentIndex - 1] : null;
  const nextPassage = currentIndex >= 0 && currentIndex < passages.length - 1 ? passages[currentIndex + 1] : null;

  return (
    <main className="page-shell passage-page">
      <ModeHeader
        chapterLabel={chapter?.adapted_title_cn || chapter?.source_title}
        passageLabel={passage.title}
        compactTitle={passage.title}
      />

      <section className="section">
        <div className="container passage-single-column">
          <article className="passage-main reader-card">
            {chapter ? <p className="reader-context-line">{chapter.adapted_title_cn || chapter.source_title}</p> : null}

            <h1 className="section-title passage-page-title">{passage.title}</h1>

            <div className="scene-reading-flow">
              {passage.reading_segments.length ? (
                passage.reading_segments.map((segment) => (
                  <section className="scene-reading-block" key={segment.id}>
                    {segment.paragraphs.length ? (
                      <div className="scene-reading-inline">
                        {segment.paragraphs.map((paragraph, paragraphIndex) => {
                          const placement = segment.comic_placements.find(
                            (item) => item.after_paragraph === paragraphIndex
                          );

                          return (
                            <div key={`${segment.id}-paragraph-${paragraphIndex}`}>
                              <div
                                className="reading-body"
                                dangerouslySetInnerHTML={{ __html: proseToHtml(paragraph) }}
                              />
                              {placement ? (
                                <div className="scene-comic-block">
                                  <ComicImageBlock
                                    passage={passage}
                                    frames={placement.frames}
                                    comicHref={`/read/${passage.id}/comic`}
                                  />
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="reading-body" dangerouslySetInnerHTML={{ __html: proseToHtml(segment.text) }} />
                    )}
                  </section>
                ))
              ) : (
                <div className="reading-body" dangerouslySetInnerHTML={{ __html: proseToHtml(passage.reading_text) }} />
              )}
            </div>

            <div className="passage-footer-nav">
              {previousPassage ? <Link className="text-nav-link" href={`/read/${previousPassage.id}`}>Previous Passage</Link> : <span />}
              {nextPassage ? (
                <Link className="button-link button-link-accent" href={`/read/${nextPassage.id}`}>
                  Next Passage
                </Link>
              ) : null}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
