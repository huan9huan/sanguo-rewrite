import type { ComicFrame, Passage } from "@/lib/types";

type ComicImageBlockProps = {
  passage: Passage;
};

function hasPanelBoxes(frames: ComicFrame[]): boolean {
  return frames.some((frame) => frame.panel_box && frame.panel_box.w > 0 && frame.panel_box.h > 0);
}

function groupFramesByRow(frames: ComicFrame[]): ComicFrame[][] {
  const positionedFrames = frames.filter((frame) => frame.panel_box);
  const rows: ComicFrame[][] = [];

  for (const frame of positionedFrames.sort((a, b) => {
    const ay = a.panel_box?.y ?? 0;
    const by = b.panel_box?.y ?? 0;
    const ax = a.panel_box?.x ?? 0;
    const bx = b.panel_box?.x ?? 0;
    return ay - by || ax - bx;
  })) {
    const currentY = frame.panel_box?.y ?? 0;
    const currentH = frame.panel_box?.h ?? 0;
    const row = rows.find((candidate) => {
      const candidateCenter =
        candidate.reduce((sum, item) => sum + (item.panel_box?.y ?? 0) + (item.panel_box?.h ?? 0) / 2, 0) /
        candidate.length;
      const currentCenter = currentY + currentH / 2;
      return Math.abs(candidateCenter - currentCenter) <= Math.max(0.035, currentH * 0.55);
    });

    if (row) {
      row.push(frame);
      row.sort((a, b) => (a.panel_box?.x ?? 0) - (b.panel_box?.x ?? 0));
    } else {
      rows.push([frame]);
    }
  }

  return rows;
}

function getFallbackPanelStyle(frame: ComicFrame, imageUrl: string) {
  const box = frame.panel_box;
  if (!box) {
    return {};
  }

  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: `${100 / box.w}% ${100 / box.h}%`,
    backgroundPosition: `${box.x * 100}% ${box.y * 100}%`,
  };
}

function getPixelCrop(frame: ComicFrame, imageWidth: number, imageHeight: number) {
  const box = frame.panel_box;
  if (!box || !imageWidth || !imageHeight) {
    return null;
  }

  return {
    x: box.x * imageWidth,
    y: box.y * imageHeight,
    width: box.w * imageWidth,
    height: box.h * imageHeight,
  };
}

function formatComicText(frame: ComicFrame): string {
  return frame.items
    .map((item) => (item.kind === "speech" ? `“${item.text}”` : item.text))
    .join(" ");
}

export function ComicImageBlock({ passage }: ComicImageBlockProps) {
  if (!passage.image) {
    return null;
  }

  const image = passage.image;
  const frames = passage.comic_layout?.frames ?? [];
  const usePinnedCaptions = hasPanelBoxes(frames);
  const frameRows = usePinnedCaptions ? groupFramesByRow(frames) : [];
  const imageWidth = image.width ?? 0;
  const imageHeight = image.height ?? 0;

  return (
    <div className="passage-image-shell">
      {usePinnedCaptions ? (
        <div className="comic-panel-rows" role="img" aria-label={passage.image.alt}>
          <div className="visually-hidden">{image.alt}</div>
          {frameRows.map((row, rowIndex) => (
            <div className="comic-panel-row" key={`${passage.id}-row-${rowIndex}`}>
              {row.map((frame, index) => (
                (() => {
                  const crop = getPixelCrop(frame, imageWidth, imageHeight);
                  return (
                    <section
                      className="comic-panel-card"
                      key={frame.frame_id || `${passage.id}-frame-${rowIndex}-${index}`}
                      style={{ flex: `${frame.panel_box?.w ?? 1} 1 0` }}
                    >
                      {crop ? (
                        <svg
                          className="comic-panel-image"
                          viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`}
                          preserveAspectRatio="xMidYMid meet"
                        >
                          <image href={image.url} x="0" y="0" width={imageWidth} height={imageHeight} />
                        </svg>
                      ) : (
                        <div
                          className="comic-panel-image comic-panel-image-fallback"
                          style={{
                            aspectRatio: frame.panel_box ? `${frame.panel_box.w} / ${frame.panel_box.h}` : undefined,
                            ...getFallbackPanelStyle(frame, image.url),
                          }}
                        />
                      )}
                      <div className="comic-panel-caption">
                        {frame.title ? <h4 className="comic-panel-title">{frame.title}</h4> : null}
                        <p className="comic-panel-text">{formatComicText(frame)}</p>
                      </div>
                    </section>
                  );
                })()
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {frames.length && !usePinnedCaptions ? (
        <>
          <div className="comic-image-stage">
            <img className="passage-image" src={image.url} alt={image.alt} />
          </div>
        <div className="comic-reader-layout">
          {frames.map((frame, index) => (
            <section className="comic-frame-card" key={frame.frame_id || `${passage.id}-frame-${index}`}>
              <div className="comic-frame-meta">
                {frame.title ? <h4 className="comic-frame-title">{frame.title}</h4> : null}
              </div>
              <div className="comic-frame-text-list">
                <p className="comic-frame-text">{formatComicText(frame)}</p>
              </div>
            </section>
          ))}
        </div>
        </>
      ) : null}

      {!frames.length ? (
        <div className="comic-image-stage">
          <img className="passage-image" src={image.url} alt={image.alt} />
        </div>
      ) : null}
    </div>
  );
}
