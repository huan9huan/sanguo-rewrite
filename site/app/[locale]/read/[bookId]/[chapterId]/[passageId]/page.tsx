import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ComicImageBlock } from "@/components/comic-image-block";
import { FollowSubscribeForm } from "@/components/follow-subscribe-form";
import { LanguageSwitch } from "@/components/language-switch";
import { ModeHeader } from "@/components/mode-header";
import { PassageFeedback } from "@/components/passage-feedback";
import { PassageSceneFocus } from "@/components/passage-scene-focus";
import { ReadingBookmarkSync } from "@/components/reading-bookmark-sync";
import { ReadingSessionTracker } from "@/components/reading-session-tracker";
import { getDictionary } from "@/i18n";
import { getBookById, getChapterById, getPassageBySlugs } from "@/lib/content";
import { proseToHtml } from "@/lib/format";
import { resolveLocalizedPassage } from "@/lib/locale";
import { buildBookHref, buildChapterHref, buildComicHref, buildLibraryHref, buildPassageHref } from "@/lib/paths";
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

export default async function LocalePassagePage({ params }: LocalePassagePageProps) {
  const { locale, bookId, chapterId, passageId } = await params;
  const safeLocale = VALID_LOCALES.includes(locale as Locale) ? (locale as Locale) : "zh";
  const t = getDictionary(safeLocale);

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
          logoHref={buildLibraryHref(safeLocale)}
          compactTitle={passage.title}
          primaryLink={{ label: bookTitle, href: buildBookHref(book.id, safeLocale) }}
          secondaryLink={{ label: chapterLabel, href: buildChapterHref(book.id, chapter.id, safeLocale) }}
        />
        <section className="section">
          <div className="container passage-single-column">
            <article className="passage-main reader-card">
              <h1 className="section-title passage-page-title">{passage.title}</h1>
              <p className="body-copy">{t.locale.passageUnavailable.replace("{locale}", safeLocale === "en" ? "English" : "中文")}</p>
              <Link className="button-link button-link-accent" href={buildPassageHref({ bookId, chapterId, passageId }, "zh")} prefetch={false}>
                {t.locale.readInOther}
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
  const nextReadablePassage = safeLocale === "en"
    ? (nextPassage?.available_locales?.includes("en") ? nextPassage : null)
    : nextPassage;
  const bookChapters = Array.isArray(book.chapters) ? book.chapters : [];
  const chapterIndex = bookChapters.findIndex((item) => item.id === chapterId);
  const nextChapterSummary = chapterIndex >= 0 && chapterIndex < bookChapters.length - 1 ? bookChapters[chapterIndex + 1] : null;
  const nextChapter = nextChapterSummary ? await getChapterById(bookId, nextChapterSummary.id) : null;
  const nextReadableChapter = safeLocale === "en"
    ? (nextChapter && Array.isArray(nextChapter.passages) && nextChapter.passages.some((item) => item.available_locales?.includes("en")) ? nextChapter : null)
    : nextChapter;
  const shouldShowFollowSubscribe =
    !nextReadablePassage &&
    !nextReadableChapter &&
    typeof book.total_chapter_count === "number" &&
    book.available_chapter_count < book.total_chapter_count;

  const routeParams: PassageRouteParams = { bookId, chapterId, passageId };

  return (
    <main className="page-shell passage-page">
      <ReadingBookmarkSync bookId={bookId} chapterId={chapterId} passageId={passageId} />
      <ReadingSessionTracker bookId={bookId} chapterId={chapterId} passageId={passageId} />
      <Suspense fallback={null}>
        <PassageSceneFocus />
      </Suspense>
      <ModeHeader
        logoHref={buildLibraryHref(safeLocale)}
        bookLabel={bookTitle}
        chapterLabel={chapterLabel}
        passageLabel={localized.title}
        compactTitle={localized.title}
        primaryLink={{ label: bookTitle, href: buildBookHref(book.id, safeLocale) }}
        actionLink={{ label: t.common.comic, href: buildComicHref(routeParams, safeLocale), prefetch: false }}
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
            {shouldShowFollowSubscribe ? (
              <FollowSubscribeForm
                bookId={bookId}
                chapterId={chapterId}
                passageId={passageId}
                trigger="next_chapter_unavailable"
                locale={safeLocale}
              />
            ) : null}

            <div className="passage-footer-nav">
              {previousPassage ? (
                <Link
                  className="text-nav-link"
                  href={buildPassageHref({ bookId, chapterId, passageId: previousPassage.passage_id }, safeLocale)}
                  prefetch={false}
                >
                  {t.common.previous}
                </Link>
              ) : (
                <Link className="text-nav-link" href={buildChapterHref(bookId, chapterId, safeLocale)} prefetch={false}>
                  {t.common.backToChapter}
                </Link>
              )}
              {nextReadablePassage ? (
                <Link
                  className="button-link button-link-accent"
                  href={buildPassageHref({ bookId, chapterId, passageId: nextReadablePassage.passage_id }, safeLocale)}
                  prefetch={false}
                >
                  {t.common.next}
                </Link>
              ) : null}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
