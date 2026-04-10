import Link from "next/link";
import { notFound } from "next/navigation";
import { ComicImageBlock } from "@/components/comic-image-block";
import { ModeHeader } from "@/components/mode-header";
import { ReadingBookmarkSync } from "@/components/reading-bookmark-sync";
import { proseToHtml } from "@/lib/format";
import { getAllBooks, getBookById, getChapterById, getPassageBySlugs } from "@/lib/content";
import { buildBookHref, buildChapterHref, buildComicHref, buildPassageHref } from "@/lib/paths";

type PassagePageProps = {
  params: Promise<{
    bookId: string;
    chapterId: string;
    passageId: string;
  }>;
};

export async function generateStaticParams() {
  const books = await getAllBooks();
  const params = await Promise.all(
    books.map(async (book) => {
      const manifest = await getBookById(book.id);
      const chapterParams = await Promise.all(
        (manifest?.chapters ?? []).map(async (chapter) => {
          const chapterManifest = await getChapterById(book.id, chapter.id);
          return (chapterManifest?.passages ?? []).map((passage) => ({
            bookId: book.id,
            chapterId: chapter.id,
            passageId: passage.passage_id,
          }));
        })
      );

      return chapterParams.flat();
    })
  );

  return params.flat();
}

export default async function PassagePage({ params }: PassagePageProps) {
  const { bookId, chapterId, passageId } = await params;
  const [book, chapter, passage] = await Promise.all([
    getBookById(bookId),
    getChapterById(bookId, chapterId),
    getPassageBySlugs(bookId, chapterId, passageId),
  ]);

  if (!book || !chapter || !passage) {
    notFound();
  }

  const chapterPassages = Array.isArray(chapter.passages) ? chapter.passages : [];
  const currentIndex = chapterPassages.findIndex((item) => item.passage_id === passage.passage_id);
  const previousPassage = currentIndex > 0 ? chapterPassages[currentIndex - 1] : null;
  const nextPassage = currentIndex >= 0 && currentIndex < chapterPassages.length - 1 ? chapterPassages[currentIndex + 1] : null;

  return (
    <main className="page-shell passage-page">
      <ReadingBookmarkSync bookId={bookId} chapterId={chapterId} passageId={passageId} />
      <ModeHeader
        chapterLabel={chapter.adapted_title_cn || chapter.source_title}
        passageLabel={passage.title}
        compactTitle={passage.title}
      />

      <section className="section">
        <div className="container passage-single-column">
          <article className="passage-main reader-card">
            <p className="reader-context-line">
              <Link href={buildBookHref(book.id)}>{book.title}</Link>
              {" / "}
              <Link href={buildChapterHref(book.id, chapter.id)}>{chapter.adapted_title_cn || chapter.source_title}</Link>
            </p>

            <h1 className="section-title passage-page-title">{passage.title}</h1>

            <div className="reader-card-actions">
              <Link className="button-link button-link-accent" href={buildComicHref({ bookId, chapterId, passageId })}>
                打开漫画
              </Link>
            </div>

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
                                    comicHref={buildComicHref({ bookId, chapterId, passageId })}
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
              {previousPassage ? (
                <Link
                  className="text-nav-link"
                  href={buildPassageHref({ bookId, chapterId, passageId: previousPassage.passage_id })}
                >
                  上一节
                </Link>
              ) : (
                <Link className="text-nav-link" href={buildChapterHref(bookId, chapterId)}>
                  返回章节
                </Link>
              )}
              {nextPassage ? (
                <Link
                  className="button-link button-link-accent"
                  href={buildPassageHref({ bookId, chapterId, passageId: nextPassage.passage_id })}
                >
                  下一节
                </Link>
              ) : null}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
