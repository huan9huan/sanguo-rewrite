import Link from "next/link";
import { ModeHeader } from "@/components/mode-header";
import { SiteFooter } from "@/components/site-footer";
import { getAllBooks } from "@/lib/content";
import { buildBookHref } from "@/lib/paths";

export default async function ReadIndexPage() {
  const books = await getAllBooks();

  return (
    <div className="page-shell reader-page">
      <main>
        <ModeHeader compactTitle="Read Chinese Classics" bookLabel="Read Chinese Classics" />

        <section className="section">
          <div className="container section-head read-index-head">
            <div>
              <h1 className="section-title">Read Chinese Classics</h1>
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
                    打开这本书
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
