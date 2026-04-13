import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ComicImageBlock } from "@/components/comic-image-block";
import { FollowSubscribeForm } from "@/components/follow-subscribe-form";
import { ModeHeader } from "@/components/mode-header";
import { PassageFeedback } from "@/components/passage-feedback";
import { PassageSceneFocus } from "@/components/passage-scene-focus";
import { ReadingBookmarkSync } from "@/components/reading-bookmark-sync";
import { ReadingSessionTracker } from "@/components/reading-session-tracker";
import { getDictionary } from "@/i18n";
import { proseToHtml } from "@/lib/format";
import { getBookById, getChapterById, getPassageBySlugs } from "@/lib/content";
import { buildBookHref, buildChapterHref, buildComicHref, buildLibraryHref, buildPassageHref } from "@/lib/paths";

type PassagePageProps = {
  params: Promise<{
    bookId: string;
    chapterId: string;
    passageId: string;
  }>;
};

export default async function PassagePage({ params }: PassagePageProps) {
  const { bookId, chapterId, passageId } = await params;
  const t = getDictionary("zh");
  const [book, chapter, passage] = await Promise.all([
    getBookById(bookId),
    getChapterById(bookId, chapterId),
    getPassageBySlugs(bookId, chapterId, passageId),
  ]);

  if (!book || !chapter || !passage) {
    notFound();
  }

  const chapterPassages = Array.isArray(chapter.passages) ? chapter.passages : [];
  const currentIndex = chapterPassages.findIndex((item) => item.passage_id === passage.passage_id);
  const previousPassage = currentIndex > 0 ? chapterPassages[currentIndex - 1] : null;
  const nextPassage = currentIndex >= 0 && currentIndex < chapterPassages.length - 1 ? chapterPassages[currentIndex + 1] : null;
  const bookChapters = Array.isArray(book.chapters) ? book.chapters : [];
  const chapterIndex = bookChapters.findIndex((item) => item.id === chapterId);
  const nextChapter = chapterIndex >= 0 && chapterIndex < bookChapters.length - 1 ? bookChapters[chapterIndex + 1] : null;
  const shouldShowFollowSubscribe =
    !nextPassage &&
    !nextChapter &&
    typeof book.total_chapter_count === "number" &&
    book.available_chapter_count < book.total_chapter_count;

  return (
    <main className="page-shell passage-page">
      <ReadingBookmarkSync bookId={bookId} chapterId={chapterId} passageId={passageId} />
      <ReadingSessionTracker bookId={bookId} chapterId={chapterId} passageId={passageId} />
      <Suspense fallback={null}>
        <PassageSceneFocus />
      </Suspense>
      <ModeHeader
        logoHref={buildLibraryHref()}
        bookLabel={book.title}
        chapterLabel={chapter.adapted_title_cn || chapter.source_title}
        passageLabel={passage.title}
        compactTitle={passage.title}
        primaryLink={{ label: book.title, href: buildBookHref(book.id) }}
        actionLink={{ label: t.common.comic, href: buildComicHref({ bookId, chapterId, passageId }), prefetch: false }}
        secondaryLink={{ label: chapter.adapted_title_cn || chapter.source_title, href: buildChapterHref(book.id, chapter.id) }}
      />

      <section className="section">
        <div className="container passage-single-column">
          <article className="passage-main reader-card">
            <h1 className="section-title passage-page-title">{passage.title}</h1>

            <div className="scene-reading-flow">
              {passage.reading.segments.length ? (
                passage.reading.segments.map((segment) => (
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
                                    comicHref={buildComicHref({ bookId, chapterId, passageId })}
                                    passageHref={buildPassageHref({ bookId, chapterId, passageId })}
                                    routeParams={{ bookId, chapterId, passageId }}
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
                <div className="reading-body" dangerouslySetInnerHTML={{ __html: proseToHtml(passage.reading.text) }} />
              )}
            </div>

            <PassageFeedback mode="text" passagePath={{ bookId, chapterId, passageId }} locale="zh" />
            {shouldShowFollowSubscribe ? (
              <FollowSubscribeForm
                bookId={bookId}
                chapterId={chapterId}
                passageId={passageId}
                trigger="next_chapter_unavailable"
                locale="zh"
              />
            ) : null}

            <div className="passage-footer-nav">
              {previousPassage ? (
                <Link
                  className="text-nav-link"
                  href={buildPassageHref({ bookId, chapterId, passageId: previousPassage.passage_id })}
                  prefetch={false}
                >
                  {t.common.previous}
                </Link>
              ) : (
                <Link className="text-nav-link" href={buildChapterHref(bookId, chapterId)} prefetch={false}>
                  {t.common.backToChapter}
                </Link>
              )}
              {nextPassage ? (
                <Link
                  className="button-link button-link-accent"
                  href={buildPassageHref({ bookId, chapterId, passageId: nextPassage.passage_id })}
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
