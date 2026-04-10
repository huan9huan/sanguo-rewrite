import { notFound } from "next/navigation";
import { BookChapterBrowser } from "@/components/book-chapter-browser";
import { ModeHeader } from "@/components/mode-header";
import { getAllBooks, getBookById, getChapterById } from "@/lib/content";

type BookPageProps = {
  params: Promise<{
    bookId: string;
  }>;
};

export async function generateStaticParams() {
  const books = await getAllBooks();
  return books.map((book) => ({ bookId: book.id }));
}

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

  return (
    <main className="page-shell reader-page">
      <ModeHeader compactTitle={book.title} />

      <section className="section">
        <div className="container section-head">
          <div>
            <p className="eyebrow">作品</p>
            <h1 className="section-title">{book.title}</h1>
            {book.subtitle ? <p className="section-copy">{book.subtitle}</p> : null}
            <p className="section-copy">{book.description}</p>
            <p className="section-copy">
              总章节：{book.total_chapter_count ?? "待定"} · 当前已支持：{book.available_chapter_count} 章
            </p>
          </div>
        </div>
      </section>

      <BookChapterBrowser bookId={book.id} chapters={chapters} />
    </main>
  );
}
