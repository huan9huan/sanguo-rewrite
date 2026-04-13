import Link from "next/link";
import { notFound } from "next/navigation";
import { ComicImageBlock } from "@/components/comic-image-block";
import { ModeHeader } from "@/components/mode-header";
import { PassageFeedback } from "@/components/passage-feedback";
import { getDictionary } from "@/i18n";
import { getAllBooks, getBookById, getChapterById, getPassageBySlugs } from "@/lib/content";
import { buildBookHref, buildChapterHref, buildComicHref, buildPassageHref } from "@/lib/paths";

type ComicPageProps = {
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

export default async function PassageComicPage({ params }: ComicPageProps) {
  const { bookId, chapterId, passageId } = await params;
  const t = getDictionary("zh");
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
      <ModeHeader
        bookLabel={book.title}
        chapterLabel={chapter.adapted_title_cn || chapter.source_title}
        passageLabel={passage.title}
        compactTitle={passage.title}
        primaryLink={{ label: book.title, href: buildBookHref(book.id) }}
        actionLink={{ label: t.common.text, href: buildPassageHref({ bookId, chapterId, passageId }) }}
        secondaryLink={{ label: chapter.adapted_title_cn || chapter.source_title, href: buildChapterHref(book.id, chapter.id) }}
      />

      <section className="section">
        <div className="container passage-single-column">
          <article className="passage-main reader-card">
            <ComicImageBlock
              passage={passage}
              passageHref={buildPassageHref({ bookId, chapterId, passageId })}
              routeParams={{ bookId, chapterId, passageId }}
            />

            <PassageFeedback mode="comic" passagePath={{ bookId, chapterId, passageId }} locale="zh" />

            <div className="passage-footer-nav">
              {previousPassage ? (
                <Link
                  className="text-nav-link"
                  href={buildComicHref({ bookId, chapterId, passageId: previousPassage.passage_id })}
                  prefetch={false}
                >
                  {t.common.previous}
                </Link>
              ) : (
                <Link className="text-nav-link" href={buildChapterHref(bookId, chapterId)} prefetch={false}>
                  {t.common.backToChapter}
                </Link>
              )}
              {nextPassage ? (
                <Link
                  className="button-link button-link-accent"
                  href={buildComicHref({ bookId, chapterId, passageId: nextPassage.passage_id })}
                  prefetch={false}
                >
                  {t.common.next}
                </Link>
              ) : null}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
