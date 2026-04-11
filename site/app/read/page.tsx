import Link from "next/link";
import { ModeHeader } from "@/components/mode-header";
import { getAllBooks } from "@/lib/content";
import { buildBookHref } from "@/lib/paths";

export default async function ReadIndexPage() {
  const books = await getAllBooks();
  const availableChapterCount = books.reduce((total, book) => total + book.available_chapter_count, 0);
  const plannedChapterCount = books.reduce((total, book) => total + (book.total_chapter_count ?? book.chapter_count), 0);

  return (
    <main className="page-shell reader-page">
      <ModeHeader />

      <section className="section">
        <div className="container section-head read-index-head">
          <div>
            <p className="eyebrow">Reader</p>
            <h1 className="section-title">书库</h1>
          </div>
          <aside className="read-progress-card" aria-label="开发进度">
            <p className="eyebrow">开发进度</p>
            <p className="read-progress-value">
              {availableChapterCount} / {plannedChapterCount}
            </p>
            <p className="read-progress-label">当前已支持章节</p>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container reader-stack">
          {books.map((book) => (
            <article className="reader-card read-book-card" key={book.id}>
              <div>
                <h2 className="passage-title">{book.title}</h2>
                {book.subtitle ? <p className="body-copy">{book.subtitle}</p> : null}
              </div>
              <div className="read-book-side">
                <span className="meta-chip">
                  {book.available_chapter_count} / {book.total_chapter_count ?? book.chapter_count} 章
                </span>
                <Link className="button-link button-link-accent" href={buildBookHref(book.id)}>
                  打开这本书
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
