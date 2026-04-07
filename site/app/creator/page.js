import { CreatorPassageCard } from "@/components/creator-passage-card";
import { ModeHeader } from "@/components/mode-header";
import { getSiteData } from "@/lib/content";

export default async function CreatorPage() {
  const data = await getSiteData();
  const working = data.memory.working_memory;
  const storyIndex = data.memory.story_index;

  return (
    <main className="page-shell">
      <ModeHeader mode="creator" />

      <section className="section">
        <div className="container section-head">
          <div>
            <p className="eyebrow">Creator Mode</p>
            <h1 className="section-title">See the planning and judgment behind each passage.</h1>
            <p className="section-copy">
              This mode exposes the layered workflow: story intent, scene planning, review issues, and
              continuity memory.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container creator-top-grid">
          <article className="panel">
            <p className="eyebrow">Pipeline</p>
            <h2 className="panel-title">A staged process protects readability.</h2>
            <ol className="timeline-list">
              {data.project.pipeline.map((step, index) => (
                <li key={step}>
                  <span className="timeline-step">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </article>

          <article className="panel panel-dark">
            <p className="eyebrow eyebrow-dark">Working Memory</p>
            <h2 className="panel-title">What the next passage must remember.</h2>
            <p className="body-copy">
              <strong>Current task:</strong> {working.current_task}
            </p>
            <p className="body-copy">
              <strong>Current focus:</strong> {working.current_focus_cn}
            </p>
            <ul className="memory-list">
              {working.carry_forward.slice(0, 8).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <article className="panel">
            <p className="eyebrow">Active Threads</p>
            <h2 className="panel-title">Story pressure that is still in motion.</h2>
            <div className="thread-grid">
              {Object.entries(storyIndex.threads || {}).map(([key, thread]) => (
                <div className="thread-card" key={key}>
                  <h3 className="thread-title">{key}</h3>
                  <p className="body-copy">{thread.summary_cn}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      {data.chapters.map((chapter) => (
        <section className="section" key={chapter.id}>
          <div className="container chapter-shell">
            <div className="chapter-banner">
              <div>
                <p className="eyebrow">Chapter {chapter.id.toUpperCase()}</p>
                <h2 className="chapter-title">{chapter.adapted_title_cn || chapter.source_title}</h2>
                <p className="section-copy">{chapter.goal_cn}</p>
              </div>
              <div className="meta-chip">{chapter.passages.length} passages</div>
            </div>

            <div className="creator-stack">
              {chapter.passages.map((passage) => (
                <CreatorPassageCard key={passage.id} passage={passage} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
