import { ComicImageBlock } from "@/components/comic-image-block";
import { markdownListToItems, proseToHtml } from "@/lib/format";
import type { Passage } from "@/lib/types";

type CreatorPassageCardProps = {
  passage: Passage;
};

export function CreatorPassageCard({ passage }: CreatorPassageCardProps) {
  const review = passage.review;

  return (
    <article className="creator-card">
      <div className="meta-row">
        <span className="status-chip">{passage.status}</span>
      </div>
      <h3 className="passage-title">{passage.title}</h3>
      <p className="body-copy">{passage.spec.goal_cn}</p>

      <ComicImageBlock passage={passage} />

      <div className="detail-grid">
        <div>
          <div className="subsection">
            <h4 className="subsection-title">Passage Summary</h4>
            <ul className="bullet-list">
              {markdownListToItems(passage.summary_markdown).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="subsection">
            <h4 className="subsection-title">Scene Plan</h4>
            <ul className="bullet-list">
              {passage.scenes.map((scene) => (
                <li key={scene.id}>
                  <strong>{scene.type}</strong>: {scene.goal}
                </li>
              ))}
            </ul>
          </div>

          <div className="subsection spec-grid">
            <div className="note-block">
              <strong>Conflict</strong>
              <p className="body-copy">{passage.spec.conflict_cn}</p>
            </div>
            <div className="note-block">
              <strong>Turn</strong>
              <p className="body-copy">{passage.spec.turn_cn}</p>
            </div>
            <div className="note-block">
              <strong>Ending Hook</strong>
              <p className="body-copy">{passage.spec.ending_hook_cn}</p>
            </div>
            <div className="note-block">
              <strong>Source Range</strong>
              <p className="body-copy">{passage.spec.source_text_range}</p>
            </div>
          </div>
        </div>

        <div>
          <div className="subsection">
            <h4 className="subsection-title">Review Verdict</h4>
            <div className="note-block">
              <strong>{review ? review.verdict : "No review yet"}</strong>
              <p className="body-copy">{review ? review.summary : "This passage does not have a review file yet."}</p>
            </div>
          </div>

          {review ? (
            <div className="subsection">
              <h4 className="subsection-title">Review Issues</h4>
              <ul className="review-list">
                {review.issues.map((issue, index) => (
                  <li key={`${issue.location}-${index}`}>
                    <div className="issue-severity">{issue.severity}</div>
                    <p className="body-copy">
                      <strong>{issue.dimension}</strong> · {issue.location}
                    </p>
                    <p className="body-copy">{issue.problem}</p>
                    <p className="body-copy">
                      <strong>Suggested fix:</strong> {issue.suggestion}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="subsection">
        <h4 className="subsection-title">Current Draft</h4>
        <div className="source-body" dangerouslySetInnerHTML={{ __html: proseToHtml(passage.draft.text) }} />
      </div>
    </article>
  );
}
