import Link from "next/link";
import { notFound } from "next/navigation";
import { ComicViewTracker } from "@/components/comic-view-tracker";
import { ComicImageBlock } from "@/components/comic-image-block";
import { ModeHeader } from "@/components/mode-header";
import { PassageFeedback } from "@/components/passage-feedback";
import { getDictionary } from "@/i18n";
import { getBookById, getChapterById, getPassageBySlugs } from "@/lib/content";
import { buildBookHref, buildChapterHref, buildComicHref, buildLibraryHref, buildPassageHref } from "@/lib/paths";

export const dynamic = "force-dynamic";

type ComicPageProps = {
  params: Promise<{
    bookId: string;
    chapterId: string;
    passageId: string;
  }>;
};

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
      <ComicViewTracker bookId={bookId} chapterId={chapterId} passageId={passageId} locale="zh" />
      <ModeHeader
        logoHref={buildLibraryHref()}
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
