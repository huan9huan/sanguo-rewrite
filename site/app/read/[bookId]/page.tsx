import { notFound } from "next/navigation";
import { BookChapterBrowser, type ReaderChapter } from "@/components/book-chapter-browser";
import { ModeHeader } from "@/components/mode-header";
import { getAllBooks, getBookById, getChapterById } from "@/lib/content";
import { buildLibraryHref } from "@/lib/paths";

type BookPageProps = {
  params: Promise<{
    bookId: string;
  }>;
};

export default async function BookPage({ params }: BookPageProps) {
  const { bookId } = await params;
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
      catchup: passage.catchup,
    })),
  }));

  return (
    <main className="page-shell reader-page">
      <ModeHeader compactTitle={book.title} logoHref={buildLibraryHref()} />

      <section className="section">
        <div className="container section-head">
          <div>
            <h1 className="section-title">{book.title}</h1>
            {book.subtitle ? <p className="section-copy">{book.subtitle}</p> : null}
          </div>
        </div>
      </section>

      <BookChapterBrowser bookId={book.id} chapters={readerChapters} />
    </main>
  );
}
