import Link from "next/link";
import { notFound } from "next/navigation";
import { ComicImageBlock } from "@/components/comic-image-block";
import { ModeHeader } from "@/components/mode-header";
import { PassageFeedback } from "@/components/passage-feedback";
import { getDictionary } from "@/i18n";
import { getAllBooks, getBookById, getChapterById, getPassageBySlugs } from "@/lib/content";
import { resolveLocalizedPassage } from "@/lib/locale";
import { buildBookHref, buildChapterHref, buildComicHref, buildPassageHref } from "@/lib/paths";
import type { Locale } from "@/lib/types";

const VALID_LOCALES: Locale[] = ["zh", "en"];

export const dynamic = "force-dynamic";

type LocaleComicPageProps = {
  params: Promise<{
    locale: string;
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
          return (chapterManifest?.passages ?? []).flatMap((passage) =>
            VALID_LOCALES.map((locale) => ({
              locale,
              bookId: book.id,
              chapterId: chapter.id,
              passageId: passage.passage_id,
            }))
          );
        })
      );

      return chapterParams.flat();
    })
  );

  return params.flat();
}

export default async function LocaleComicPage({ params }: LocaleComicPageProps) {
  const { locale, bookId, chapterId, passageId } = await params;
  const safeLocale = VALID_LOCALES.includes(locale as Locale) ? (locale as Locale) : "zh";
  const t = getDictionary(safeLocale);

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

  const isEn = safeLocale === "en";
  const localized = resolveLocalizedPassage(passage, safeLocale);
  const comicFrames = localized?.reading?.comic?.layout?.frames;
  const bookTitle = isEn && book.title_en ? book.title_en : book.title;
  const chapterLabel = isEn && chapter.display_title_en ? chapter.display_title_en : (chapter.adapted_title_cn || chapter.source_title);

  return (
    <main className="page-shell passage-page">
      <ModeHeader
        bookLabel={bookTitle}
        chapterLabel={chapterLabel}
        passageLabel={passage.title}
        compactTitle={passage.title}
        primaryLink={{ label: bookTitle, href: buildBookHref(book.id, safeLocale) }}
        actionLink={{ label: t.common.text, href: buildPassageHref({ bookId, chapterId, passageId }, safeLocale) }}
        secondaryLink={{ label: chapterLabel, href: buildChapterHref(book.id, chapter.id, safeLocale) }}
      />

      <section className="section">
        <div className="container passage-single-column">
          <article className="passage-main reader-card">
            <ComicImageBlock
              passage={passage}
              frames={comicFrames}
              passageHref={buildPassageHref({ bookId, chapterId, passageId }, safeLocale)}
              locale={safeLocale === "en" ? "en" : "zh-CN"}
              routeParams={{ bookId, chapterId, passageId }}
            />

            <PassageFeedback mode="comic" passagePath={{ bookId, chapterId, passageId }} locale={safeLocale} />

            <div className="passage-footer-nav">
              {previousPassage ? (
                <Link
                  className="text-nav-link"
                  href={buildComicHref({ bookId, chapterId, passageId: previousPassage.passage_id }, safeLocale)}
                  prefetch={false}
                >
                  {t.common.previous}
                </Link>
              ) : (
                <Link className="text-nav-link" href={buildChapterHref(bookId, chapterId, safeLocale)} prefetch={false}>
                  {t.common.backToChapter}
                </Link>
              )}
              {nextPassage ? (
                <Link
                  className="button-link button-link-accent"
                  href={buildComicHref({ bookId, chapterId, passageId: nextPassage.passage_id }, safeLocale)}
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
