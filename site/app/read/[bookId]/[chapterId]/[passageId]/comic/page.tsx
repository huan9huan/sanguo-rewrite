import Link from "next/link";
import { notFound } from "next/navigation";
import { ComicImageBlock } from "@/components/comic-image-block";
import { ModeHeader } from "@/components/mode-header";
import { getAllBooks, getBookById, getChapterById, getPassageBySlugs } from "@/lib/content";
import { buildBookHref, buildChapterHref, buildPassageHref } from "@/lib/paths";

type ComicPageProps = {
  params: Promise<{
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
          return (chapterManifest?.passages ?? []).map((passage) => ({
            bookId: book.id,
            chapterId: chapter.id,
            passageId: passage.passage_id,
          }));
        })
      );

      return chapterParams.flat();
    })
  );

  return params.flat();
}

export default async function PassageComicPage({ params }: ComicPageProps) {
  const { bookId, chapterId, passageId } = await params;
  const [book, chapter, passage] = await Promise.all([
    getBookById(bookId),
    getChapterById(bookId, chapterId),
    getPassageBySlugs(bookId, chapterId, passageId),
  ]);

  if (!book || !chapter || !passage) {
    notFound();
  }

  return (
    <main className="page-shell passage-page">
      <ModeHeader
        bookLabel={book.title}
        chapterLabel={chapter.adapted_title_cn || chapter.source_title}
        passageLabel={passage.title}
        compactTitle={passage.title}
        primaryLink={{ label: book.title, href: buildBookHref(book.id) }}
        actionLink={{ label: "正文", href: buildPassageHref({ bookId, chapterId, passageId }) }}
        secondaryLink={{ label: chapter.adapted_title_cn || chapter.source_title, href: buildChapterHref(book.id, chapter.id) }}
      />

      <section className="section">
        <div className="container comic-focus-shell">
          <article className="panel comic-focus-header">
            <p className="eyebrow">{book.title}</p>
            <h1 className="section-title passage-page-title">{passage.title}</h1>
            <p className="section-copy">
              用漫画模式阅读这一节，需要时再随时回到正文。
            </p>
            <div className="reader-card-actions">
              <Link className="button-link" href={buildPassageHref({ bookId, chapterId, passageId })}>
                返回正文
              </Link>
              <Link className="button-link button-link-accent" href={buildChapterHref(bookId, chapterId)}>
                返回章节
              </Link>
            </div>
          </article>

          <section className="panel comic-focus-panel">
            <ComicImageBlock
              passage={passage}
              passageHref={buildPassageHref({ bookId, chapterId, passageId })}
              routeParams={{ bookId, chapterId, passageId }}
            />
          </section>
        </div>
      </section>
    </main>
  );
}
