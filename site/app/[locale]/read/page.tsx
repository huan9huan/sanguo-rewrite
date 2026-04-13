import Link from "next/link";
import { ModeHeader } from "@/components/mode-header";
import { SiteFooter } from "@/components/site-footer";
import { FutureBookForm } from "@/components/future-book-form";
import { getDictionary } from "@/i18n";
import { getAllBooks } from "@/lib/content";
import { buildBookHref, buildLibraryHref } from "@/lib/paths";
import type { Locale } from "@/lib/types";

const VALID_LOCALES: Locale[] = ["zh", "en"];

type LocaleReadIndexPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return VALID_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleReadIndexPage({ params }: LocaleReadIndexPageProps) {
  const { locale } = await params;
  const safeLocale = VALID_LOCALES.includes(locale as Locale) ? (locale as Locale) : "zh";
  const books = await getAllBooks();
  const t = getDictionary(safeLocale);
  const isEn = safeLocale === "en";

  return (
    <div className="page-shell reader-page">
      <main>
        <ModeHeader compactTitle={t.read.pageTitle} bookLabel={t.read.pageTitle} locale={safeLocale} logoHref={buildLibraryHref(safeLocale)} />

        <section className="section">
          <div className="container section-head read-index-head">
            <div>
              <h1 className="section-title">{t.read.pageTitle}</h1>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container reader-stack">
            {books.map((book) => {
              const bookTitle = isEn && book.title_en ? book.title_en : book.title;
              const bookSubtitle = isEn && book.subtitle_en ? book.subtitle_en : book.subtitle;

              return (
                <article className="reader-card read-book-card" key={book.id}>
                  <div>
                    <h2 className="passage-title">{bookTitle}</h2>
                    {bookSubtitle ? <p className="body-copy">{bookSubtitle}</p> : null}
                  </div>
                  <div className="read-book-side">
                    <Link className="button-link button-link-accent" href={buildBookHref(book.id, safeLocale)}>
                      {t.read.openBook}
                    </Link>
                  </div>
                </article>
              );
            })}

            <FutureBookForm locale={safeLocale} />
          </div>
        </section>
      </main>
      <SiteFooter locale={safeLocale} />
    </div>
  );
}
