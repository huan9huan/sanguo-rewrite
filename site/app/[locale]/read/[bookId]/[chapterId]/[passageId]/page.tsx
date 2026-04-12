import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ComicImageBlock } from "@/components/comic-image-block";
import { LanguageSwitch } from "@/components/language-switch";
import { ModeHeader } from "@/components/mode-header";
import { PassageFeedback } from "@/components/passage-feedback";
import { PassageSceneFocus } from "@/components/passage-scene-focus";
import { ReadingBookmarkSync } from "@/components/reading-bookmark-sync";
import { getAllBooks, getBookById, getChapterById, getPassageBySlugs } from "@/lib/content";
import { proseToHtml } from "@/lib/format";
import { resolveLocalizedPassage } from "@/lib/locale";
import { buildBookHref, buildChapterHref, buildComicHref, buildPassageHref } from "@/lib/paths";
import type { Locale, PassageRouteParams } from "@/lib/types";

const VALID_LOCALES: Locale[] = ["zh", "en"];

type LocalePassagePageProps = {
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

export default async function LocalePassagePage({ params }: LocalePassagePageProps) {
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

  const localized = resolveLocalizedPassage(passage, safeLocale);
  const isEn = safeLocale === "en";
  const bookTitle = isEn && book.title_en ? book.title_en : book.title;
  const chapterLabel = isEn && chapter.display_title_en ? chapter.display_title_en : (chapter.adapted_title_cn || chapter.source_title);

  if (!localized) {
    return (
      <main className="page-shell passage-page">
        <ModeHeader
          compactTitle={passage.title}
          primaryLink={{ label: bookTitle, href: buildBookHref(book.id, safeLocale) }}
          secondaryLink={{ label: chapterLabel, href: buildChapterHref(book.id, chapter.id, safeLocale) }}
        />
        <section className="section">
          <div className="container passage-single-column">
            <article className="passage-main reader-card">
              <h1 className="section-title passage-page-title">{passage.title}</h1>
              <p className="body-copy">This passage is not yet available in {safeLocale === "en" ? "English" : "Chinese"}.</p>
              <Link className="button-link button-link-accent" href={buildPassageHref({ bookId, chapterId, passageId }, "zh")}>
                Read in Chinese
              </Link>
            </article>
          </div>
        </section>
      </main>
    );
  }

  const chapterPassages = Array.isArray(chapter.passages) ? chapter.passages : [];
  const currentIndex = chapterPassages.findIndex((item) => item.passage_id === passage.passage_id);
  const previousPassage = currentIndex > 0 ? chapterPassages[currentIndex - 1] : null;
  const nextPassage = currentIndex >= 0 && currentIndex < chapterPassages.length - 1 ? chapterPassages[currentIndex + 1] : null;

  const routeParams: PassageRouteParams = { bookId, chapterId, passageId };

  return (
    <main className="page-shell passage-page">
      <ReadingBookmarkSync bookId={bookId} chapterId={chapterId} passageId={passageId} />
      <Suspense fallback={null}>
        <PassageSceneFocus />
      </Suspense>
      <ModeHeader
        bookLabel={bookTitle}
        chapterLabel={chapterLabel}
        passageLabel={localized.title}
        compactTitle={localized.title}
        primaryLink={{ label: bookTitle, href: buildBookHref(book.id, safeLocale) }}
        actionLink={{ label: isEn ? "Comic" : "漫画", href: buildComicHref(routeParams, safeLocale) }}
        secondaryLink={{ label: chapterLabel, href: buildChapterHref(book.id, chapter.id, safeLocale) }}
      />

      <section className="section">
        <div className="container passage-single-column">
          <article className="passage-main reader-card">
            <div className="passage-page-header-row">
              <h1 className="section-title passage-page-title">{localized.title}</h1>
              <LanguageSwitch
                currentLocale={safeLocale}
                availableLocales={passage.available_locales}
                localeHrefs={{ zh: buildPassageHref(routeParams, "zh"), en: buildPassageHref(routeParams, "en") }}
              />
            </div>

            <div className="scene-reading-flow">
              {localized.reading.segments.length ? (
                localized.reading.segments.map((segment) => (
                  <section className="scene-reading-block" key={segment.id} id={`scene-${segment.scene_id}`} data-scene-id={segment.scene_id}>
                    {segment.paragraphs.length ? (
                      <div className="scene-reading-inline">
                        {segment.paragraphs.map((paragraph, paragraphIndex) => {
                          const placement = segment.comic_placements.find(
                            (item) => item.after_paragraph === paragraphIndex
                          );

                          return (
                            <div key={`${segment.id}-paragraph-${paragraphIndex}`}>
                              <div
                                className="reading-body"
                                dangerouslySetInnerHTML={{ __html: proseToHtml(paragraph) }}
                              />
                              {placement ? (
                                <div
                                  className="scene-comic-block"
                                  data-frame-ids={placement.frames.map((frame) => frame.frame_id).join(" ")}
                                >
                                  <ComicImageBlock
                                    passage={passage}
                                    frames={placement.frames}
                                    comicHref={buildComicHref(routeParams, safeLocale)}
                                    passageHref={buildPassageHref(routeParams, safeLocale)}
                                    locale={safeLocale === "en" ? "en" : "zh-CN"}
                                    routeParams={routeParams}
                                  />
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="reading-body" dangerouslySetInnerHTML={{ __html: proseToHtml(segment.text) }} />
                    )}
                  </section>
                ))
              ) : (
                <div className="reading-body" dangerouslySetInnerHTML={{ __html: proseToHtml(localized.reading.text) }} />
              )}
            </div>

            <PassageFeedback mode="text" passagePath={{ bookId, chapterId, passageId }} locale={safeLocale} />

            <div className="passage-footer-nav">
              {previousPassage ? (
                <Link
                  className="text-nav-link"
                  href={buildPassageHref({ bookId, chapterId, passageId: previousPassage.passage_id }, safeLocale)}
                >
                  {isEn ? "Previous" : "上一节"}
                </Link>
              ) : (
                <Link className="text-nav-link" href={buildChapterHref(bookId, chapterId, safeLocale)}>
                  {isEn ? "Back to chapter" : "返回章节"}
                </Link>
              )}
              {nextPassage ? (
                <Link
                  className="button-link button-link-accent"
                  href={buildPassageHref({ bookId, chapterId, passageId: nextPassage.passage_id }, safeLocale)}
                >
                  {isEn ? "Next" : "下一节"}
                </Link>
              ) : null}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
