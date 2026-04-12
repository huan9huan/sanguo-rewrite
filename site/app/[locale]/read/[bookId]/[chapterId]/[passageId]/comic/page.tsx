import Link from "next/link";
import { notFound } from "next/navigation";
import { ComicImageBlock } from "@/components/comic-image-block";
import { ModeHeader } from "@/components/mode-header";
import { PassageFeedback } from "@/components/passage-feedback";
import { getAllBooks, getBookById, getChapterById, getPassageBySlugs } from "@/lib/content";
import { buildBookHref, buildChapterHref, buildPassageHref } from "@/lib/paths";
import type { Locale } from "@/lib/types";

const VALID_LOCALES: Locale[] = ["zh", "en"];

type LocaleComicPageProps = {
  params: Promise<{
    locale: string;
    bookId: string;
    chapterId: string;
    passageId: string;
  }>;
};

export async function generateStaticParams() {
  const books = await getAllBooks();
  const params = await Promise.all(
    books.map(async (book) => {
      const manifest = await getBookById(book.id);
      const chapterParams = await Promise.all(
        (manifest?.chapters ?? []).map(async (chapter) => {
          const chapterManifest = await getChapterById(book.id, chapter.id);
          return (chapterManifest?.passages ?? []).flatMap((passage) =>
            VALID_LOCALES.map((locale) => ({
              locale,
              bookId: book.id,
              chapterId: chapter.id,
              passageId: passage.passage_id,
            }))
          );
        })
      );

      return chapterParams.flat();
    })
  );

  return params.flat();
}

export default async function LocaleComicPage({ params }: LocaleComicPageProps) {
  const { locale, bookId, chapterId, passageId } = await params;
  const safeLocale = VALID_LOCALES.includes(locale as Locale) ? (locale as Locale) : "zh";

  const [book, chapter, passage] = await Promise.all([
    getBookById(bookId),
    getChapterById(bookId, chapterId),
    getPassageBySlugs(bookId, chapterId, passageId),
  ]);

  if (!book || !chapter || !passage) {
    notFound();
  }

  const isEn = safeLocale === "en";
  const bookTitle = isEn && book.title_en ? book.title_en : book.title;
  const chapterLabel = isEn && chapter.display_title_en ? chapter.display_title_en : (chapter.adapted_title_cn || chapter.source_title);

  return (
    <main className="page-shell passage-page">
      <ModeHeader
        bookLabel={bookTitle}
        chapterLabel={chapterLabel}
        passageLabel={passage.title}
        compactTitle={passage.title}
        primaryLink={{ label: bookTitle, href: buildBookHref(book.id, safeLocale) }}
        actionLink={{ label: isEn ? "Text" : "正文", href: buildPassageHref({ bookId, chapterId, passageId }, safeLocale) }}
        secondaryLink={{ label: chapterLabel, href: buildChapterHref(book.id, chapter.id, safeLocale) }}
      />

      <section className="section">
        <div className="container passage-single-column">
          <article className="passage-main reader-card">
            <p className="eyebrow">{bookTitle}</p>
            <h1 className="section-title passage-page-title">{passage.title}</h1>
            <p className="section-copy">
              {isEn ? "Read this passage in comic mode, switch to text anytime." : "用漫画模式阅读这一节，需要时再随时回到正文。"}
            </p>
            <div className="reader-card-actions">
              <Link className="button-link" href={buildPassageHref({ bookId, chapterId, passageId }, safeLocale)}>
                {isEn ? "Back to text" : "返回正文"}
              </Link>
              <Link className="button-link button-link-accent" href={buildChapterHref(bookId, chapterId, safeLocale)}>
                {isEn ? "Back to chapter" : "返回章节"}
              </Link>
            </div>

            <ComicImageBlock
              passage={passage}
              passageHref={buildPassageHref({ bookId, chapterId, passageId }, safeLocale)}
              locale={safeLocale === "en" ? "en" : "zh-CN"}
              routeParams={{ bookId, chapterId, passageId }}
            />

            <PassageFeedback mode="comic" passagePath={{ bookId, chapterId, passageId }} />
          </article>
        </div>
      </section>
    </main>
  );
}
