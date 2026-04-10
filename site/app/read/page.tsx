import Link from "next/link";
import { ModeHeader } from "@/components/mode-header";
import { getAllBooks } from "@/lib/content";
import { buildBookHref } from "@/lib/paths";

export default async function ReadIndexPage() {
  const books = await getAllBooks();

  return (
    <main className="page-shell reader-page">
      <ModeHeader />

      <section className="section">
        <div className="container section-head">
          <div>
            <p className="eyebrow">Reader</p>
            <h1 className="section-title">书库</h1>
            <p className="section-copy">网站现在只保留阅读体验。流程说明以 workflow spec 和仓库资产为准，不再单独维护 Creator 模式。</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container reader-stack">
          {books.map((book) => (
            <article className="reader-card" key={book.id}>
              <h2 className="passage-title">{book.title}</h2>
              {book.subtitle ? <p className="body-copy">{book.subtitle}</p> : null}
              <p className="body-copy">{book.description}</p>
              <div className="reader-card-actions">
                <span className="meta-chip">
                  已支持 {book.available_chapter_count} / {book.total_chapter_count ?? book.chapter_count} 章
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
