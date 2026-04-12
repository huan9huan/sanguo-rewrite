import { notFound } from "next/navigation";
import { BookChapterBrowser, type ReaderChapter } from "@/components/book-chapter-browser";
import { ModeHeader } from "@/components/mode-header";
import { getAllBooks, getBookById, getChapterById } from "@/lib/content";
import type { Locale } from "@/lib/types";

const VALID_LOCALES: Locale[] = ["zh", "en"];

type LocaleBookPageProps = {
  params: Promise<{
    locale: string;
    bookId: string;
  }>;
};

export async function generateStaticParams() {
  const books = await getAllBooks();
  return books.flatMap((book) =>
    VALID_LOCALES.map((locale) => ({
      locale,
      bookId: book.id,
    }))
  );
}

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
  const readerChapters: ReaderChapter[] = chapters.map((chapter) => ({
    id: chapter.id,
    source_title: chapter.source_title,
    passages: chapter.passages.map((passage) => ({
      id: passage.id,
      passage_id: passage.passage_id,
      title: passage.title,
      title_en: passage.title_en,
      catchup: passage.catchup_en ?? passage.catchup,
      available_locales: passage.available_locales,
    })),
  }));

  return (
    <main className="page-shell reader-page">
      <ModeHeader compactTitle={book.title} />

      <section className="section">
        <div className="container section-head">
          <div>
            <h1 className="section-title">{book.title}</h1>
            {book.subtitle ? <p className="section-copy">{book.subtitle}</p> : null}
          </div>
        </div>
      </section>

      <BookChapterBrowser bookId={book.id} chapters={readerChapters} locale={safeLocale} />
    </main>
  );
}
