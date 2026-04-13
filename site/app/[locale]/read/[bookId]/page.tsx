import { notFound } from "next/navigation";
import { BookChapterBrowser, type ReaderChapter } from "@/components/book-chapter-browser";
import { ModeHeader } from "@/components/mode-header";
import { getAllBooks, getBookById, getChapterById } from "@/lib/content";
import { buildLibraryHref } from "@/lib/paths";
import type { Locale } from "@/lib/types";

const VALID_LOCALES: Locale[] = ["zh", "en"];

type LocaleBookPageProps = {
  params: Promise<{
    locale: string;
    bookId: string;
  }>;
};

export default async function LocaleBookPage({ params }: LocaleBookPageProps) {
  const { locale, bookId } = await params;
  const safeLocale = VALID_LOCALES.includes(locale as Locale) ? (locale as Locale) : "zh";

  const book = await getBookById(bookId);

  if (!book) {
    notFound();
  }

  const chapterSummaries = Array.isArray(book.chapters) ? book.chapters : [];
  const chapters = (
    await Promise.all(chapterSummaries.map((chapter) => getChapterById(book.id, chapter.id)))
  ).filter((chapter): chapter is NonNullable<Awaited<ReturnType<typeof getChapterById>>> => Boolean(chapter));
  const isEn = safeLocale === "en";
  const visibleChapters = isEn
    ? chapters.filter((chapter) => chapter.passages.some((passage) => passage.available_locales?.includes("en")))
    : chapters;

  const readerChapters: ReaderChapter[] = visibleChapters.map((chapter) => ({
    id: chapter.id,
    source_title: chapter.source_title,
    display_title_en: chapter.display_title_en,
    passages: chapter.passages.map((passage) => ({
      id: passage.id,
      passage_id: passage.passage_id,
      title: passage.title,
      title_en: passage.title_en,
      catchup: isEn && passage.catchup_en ? passage.catchup_en : passage.catchup,
      available_locales: passage.available_locales,
    })),
  }));
  const bookTitle = isEn && book.title_en ? book.title_en : book.title;
  const bookSubtitle = isEn && book.subtitle_en ? book.subtitle_en : book.subtitle;

  return (
    <main className="page-shell reader-page">
      <ModeHeader compactTitle={bookTitle} logoHref={buildLibraryHref(safeLocale)} />

      <section className="section">
        <div className="container section-head">
          <div>
            <h1 className="section-title">{bookTitle}</h1>
            {bookSubtitle ? <p className="section-copy">{bookSubtitle}</p> : null}
          </div>
        </div>
      </section>

      <BookChapterBrowser bookId={book.id} chapters={readerChapters} locale={safeLocale} />
    </main>
  );
}
