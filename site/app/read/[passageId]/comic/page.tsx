import Link from "next/link";
import { notFound } from "next/navigation";
import { ComicImageBlock } from "@/components/comic-image-block";
import { ModeHeader } from "@/components/mode-header";
import { getAllPassages, getPassageById, getSiteData } from "@/lib/content";

type ComicPageProps = {
  params: Promise<{
    passageId: string;
  }>;
};

export async function generateStaticParams() {
  const passages = await getAllPassages();
  return passages.map((passage) => ({ passageId: passage.id }));
}

export default async function PassageComicPage({ params }: ComicPageProps) {
  const { passageId } = await params;
  const passage = await getPassageById(passageId);

  if (!passage) {
    notFound();
  }

  const data = await getSiteData();
  const chapter = data.chapters.find((item) => item.id === passage.chapter_id);

  return (
    <main className="page-shell passage-page">
      <ModeHeader
        chapterLabel={chapter?.adapted_title_cn || chapter?.source_title}
        passageLabel={passage.title}
        compactTitle={passage.title}
      />

      <section className="section">
        <div className="container comic-focus-shell">
          <article className="panel comic-focus-header">
            <p className="eyebrow">Comic Focus</p>
            <h1 className="section-title passage-page-title">{passage.title}</h1>
            <p className="section-copy">
              Read this passage in visual mode, then jump back to the full blended passage whenever you want.
            </p>
            <div className="reader-card-actions">
              <Link className="button-link" href={`/read/${passage.id}`}>
                Back to Passage
              </Link>
              <Link className="button-link button-link-accent" href="/read">
                All Passages
              </Link>
            </div>
          </article>

          <section className="panel comic-focus-panel">
            <ComicImageBlock passage={passage} />
          </section>
        </div>
      </section>
    </main>
  );
}
