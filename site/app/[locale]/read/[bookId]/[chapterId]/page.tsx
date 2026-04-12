import Link from "next/link";
import { notFound } from "next/navigation";
import { ModeHeader } from "@/components/mode-header";
import { formatChapterTitle } from "@/lib/chapter-title";
import { getAllBooks, getBookById, getChapterById } from "@/lib/content";
import { buildComicHref, buildPassageHref } from "@/lib/paths";
import type { Locale } from "@/lib/types";

const VALID_LOCALES: Locale[] = ["zh", "en"];

type LocaleChapterPageProps = {
  params: Promise<{
    locale: string;
    bookId: string;
    chapterId: string;
  }>;
};

export async function generateStaticParams() {
  const books = await getAllBooks();
  const params = await Promise.all(
    books.map(async (book) => {
      const manifest = await getBookById(book.id);
      return (manifest?.chapters ?? []).flatMap((chapter) =>
        VALID_LOCALES.map((locale) => ({
          locale,
          bookId: book.id,
          chapterId: chapter.id,
        }))
      );
    })
  );

  return params.flat();
}

export default async function LocaleChapterPage({ params }: LocaleChapterPageProps) {
  const { locale, bookId, chapterId } = await params;
  const safeLocale = VALID_LOCALES.includes(locale as Locale) ? (locale as Locale) : "zh";

  const [book, chapter] = await Promise.all([getBookById(bookId), getChapterById(bookId, chapterId)]);

  if (!book || !chapter) {
    notFound();
  }

  const passages = Array.isArray(chapter.passages) ? chapter.passages : [];
  const chapterTitle = formatChapterTitle(chapter);

  return (
    <main className="page-shell reader-page">
      <ModeHeader chapterLabel={chapterTitle} compactTitle={chapterTitle} />

      <section className="section">
        <div className="container section-head">
          <div>
            <p className="eyebrow">{book.title}</p>
            <h1 className="section-title">{chapterTitle}</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container reader-stack">
          {passages.map((passage) => {
            const hasCurrentLocale = passage.available_locales?.includes(safeLocale);

            return (
              <article className="reader-card" key={passage.id}>
                <h2 className="passage-title">
                  {passage.title}
                  {safeLocale === "en" && !hasCurrentLocale ? (
                    <span className="locale-badge locale-badge-unavailable">EN unavailable</span>
                  ) : null}
                </h2>
                {passage.catchup ? <p className="body-copy">{passage.catchup}</p> : null}
                <div className="reader-card-actions">
                  <Link
                    className="button-link button-link-accent"
                    href={buildPassageHref({ bookId, chapterId, passageId: passage.passage_id }, safeLocale)}
                  >
                    正文
                  </Link>
                  <Link
                    className="button-link button-link-secondary"
                    href={buildComicHref({ bookId, chapterId, passageId: passage.passage_id }, safeLocale)}
                  >
                    漫画
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
