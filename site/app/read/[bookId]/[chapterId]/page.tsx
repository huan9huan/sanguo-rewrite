import Link from "next/link";
import { notFound } from "next/navigation";
import { ModeHeader } from "@/components/mode-header";
import { getAllBooks, getBookById, getChapterById } from "@/lib/content";
import { buildPassageHref } from "@/lib/paths";

type ChapterPageProps = {
  params: Promise<{
    bookId: string;
    chapterId: string;
  }>;
};

export async function generateStaticParams() {
  const books = await getAllBooks();
  const params = await Promise.all(
    books.map(async (book) => {
      const manifest = await getBookById(book.id);
      return (manifest?.chapters ?? []).map((chapter) => ({
        bookId: book.id,
        chapterId: chapter.id,
      }));
    })
  );

  return params.flat();
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { bookId, chapterId } = await params;
  const [book, chapter] = await Promise.all([getBookById(bookId), getChapterById(bookId, chapterId)]);

  if (!book || !chapter) {
    notFound();
  }

  const passages = Array.isArray(chapter.passages) ? chapter.passages : [];

  return (
    <main className="page-shell reader-page">
      <ModeHeader chapterLabel={chapter.adapted_title_cn || chapter.source_title} compactTitle={chapter.adapted_title_cn} />

      <section className="section">
        <div className="container section-head">
          <div>
            <p className="eyebrow">{book.title}</p>
            <h1 className="section-title">{chapter.adapted_title_cn || chapter.source_title}</h1>
            <p className="section-copy">{chapter.goal_cn}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container reader-stack">
          {passages.map((passage) => (
            <article className="reader-card" key={passage.id}>
              <h2 className="passage-title">{passage.short_title || passage.title}</h2>
              {passage.catchup || passage.teaser ? <p className="body-copy">{passage.catchup || passage.teaser}</p> : null}
              <div className="reader-card-actions">
                <Link
                  className="button-link button-link-accent"
                  href={buildPassageHref({ bookId, chapterId, passageId: passage.passage_id })}
                >
                  进入正文
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
