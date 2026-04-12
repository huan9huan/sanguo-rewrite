import Link from "next/link";
import { ModeHeader } from "@/components/mode-header";
import { SiteFooter } from "@/components/site-footer";
import { FutureBookForm } from "@/components/future-book-form";
import { getDictionary } from "@/i18n";
import { getAllBooks } from "@/lib/content";
import { buildBookHref } from "@/lib/paths";

export default async function ReadIndexPage() {
  const books = await getAllBooks();
  const t = getDictionary("zh");

  return (
    <div className="page-shell reader-page">
      <main>
        <ModeHeader compactTitle={t.read.pageTitle} bookLabel={t.read.pageTitle} />

        <section className="section">
          <div className="container section-head read-index-head">
            <div>
              <h1 className="section-title">{t.read.pageTitle}</h1>
            </div>
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
                  <Link className="button-link button-link-accent" href={buildBookHref(book.id)}>
                    {t.read.openBook}
                  </Link>
                </div>
              </article>
            ))}

            <FutureBookForm locale="zh" />
          </div>
        </section>
      </main>
      <SiteFooter locale="zh" />
    </div>
  );
}
