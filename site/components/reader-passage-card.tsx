import { ComicImageBlock } from "@/components/comic-image-block";
import { markdownListToItems, proseToHtml } from "@/lib/format";
import type { Passage } from "@/lib/types";

type ReaderPassageCardProps = {
  passage: Passage;
};

export function ReaderPassageCard({ passage }: ReaderPassageCardProps) {
  const summaryItems = markdownListToItems(passage.summary_markdown);

  return (
    <article className="reader-card">
      <div className="meta-row">
        <span className="status-chip">{passage.reading.source === "approved_cn" ? "Approved CN" : "Latest Draft"}</span>
      </div>
      <h3 className="passage-title">{passage.title}</h3>
      <p className="body-copy">{passage.spec.dramatic_question_cn}</p>

      <ComicImageBlock passage={passage} />

      <div className="summary-block">
        <ul className="bullet-list">
          {summaryItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="reading-body" dangerouslySetInnerHTML={{ __html: proseToHtml(passage.reading.text) }} />
    </article>
  );
}
