"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import type { ComicFrame, Passage } from "@/lib/types";
import { buildSceneHref } from "@/lib/paths";

const COMPACT_PANEL_WIDTH = 560;
const MAX_COMPACT_UPSCALE = 1.08;
const NARROW_PANEL_RATIO = 0.62;

type ComicImageBlockProps = {
  passage: Passage;
  frames?: ComicFrame[];
  comicHref?: string;
  passageHref?: string;
  locale?: string;
  routeParams?: {
    bookId: string;
    chapterId: string;
    passageId: string;
  };
};

function hasPanelBoxes(frames: ComicFrame[]): boolean {
  return frames.some((frame) => frame.panel_box && frame.panel_box.w > 0 && frame.panel_box.h > 0);
}

function sortFramesByLayout(frames: ComicFrame[]): ComicFrame[] {
  return [...frames].sort((a, b) => {
    const ay = a.panel_box?.y ?? 0;
    const by = b.panel_box?.y ?? 0;
    const ax = a.panel_box?.x ?? 0;
    const bx = b.panel_box?.x ?? 0;
    return ay - by || ax - bx;
  });
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

function getPanelCardStyle(crop: ReturnType<typeof getPixelCrop>): CSSProperties | undefined {
  if (!crop) {
    return undefined;
  }

  return {
    "--comic-panel-max-width": `${Math.ceil(crop.width * MAX_COMPACT_UPSCALE)}px`,
  } as CSSProperties;
}

function shouldUseSideCaption(frame: ComicFrame, crop: ReturnType<typeof getPixelCrop>): boolean {
  const box = frame.panel_box;
  if (!box || !crop) {
    return false;
  }

  return crop.width < COMPACT_PANEL_WIDTH && box.w < NARROW_PANEL_RATIO;
}

function formatComicText(frame: ComicFrame, locale?: string): string {
  let items = Array.isArray(frame.items) ? frame.items : [];
  if (locale) {
    items = items.filter((item) => item.lang === locale);
  }
  return items
    .map((item) => (item.kind === "speech" ? `“${item.text}”` : item.text))
    .map((text) =>
      text
        .replace(/([。！？!?][”"」』）】]*)/g, "$1\n")
        .replace(/\n{2,}/g, "\n")
        .trim()
    )
    .join("\n")
    .trim();
}

function getFrameHref(
  routeParams: ComicImageBlockProps["routeParams"],
  frame: ComicFrame,
  passageHref?: string
) {
  if (routeParams && frame.scene_id) {
    return buildSceneHref(routeParams, frame.scene_id, frame.frame_id);
  }

  if (!passageHref || !frame.scene_id) {
    return null;
  }

  const searchParams = new URLSearchParams({ scene: frame.scene_id });
  if (frame.frame_id) {
    searchParams.set("frame", frame.frame_id);
  }

  return `${passageHref}?${searchParams.toString()}`;
}

export function ComicImageBlock({
  passage,
  frames: framesOverride,
  comicHref,
  passageHref,
  locale,
  routeParams,
}: ComicImageBlockProps) {
  const router = useRouter();
  const image = passage.reading.comic.image;
  if (!image) {
    return null;
  }

  const framesSource = framesOverride ?? passage.reading.comic.layout?.frames ?? [];
  const frames = Array.isArray(framesSource) ? framesSource : [];
  const usePinnedCaptions = hasPanelBoxes(frames);
  const orderedFrames = usePinnedCaptions ? sortFramesByLayout(frames) : [];
  const imageWidth = image.width ?? 0;
  const imageHeight = image.height ?? 0;
  const interactiveProps = comicHref
    ? {
        onDoubleClick: () => router.push(comicHref),
        role: "button" as const,
        tabIndex: 0,
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            router.push(comicHref);
          }
        },
      }
    : {};

  return (
    <div className={`passage-image-shell ${comicHref ? "passage-image-shell-actionable" : ""}`} {...interactiveProps}>
      {usePinnedCaptions ? (
        <div className="comic-panel-stack" role="img" aria-label={image.alt}>
          <div className="visually-hidden">{image.alt}</div>
          {orderedFrames.map((frame, index) => {
            const crop = getPixelCrop(frame, imageWidth, imageHeight);
            const frameHref = getFrameHref(routeParams, frame, passageHref);
            const isCompact = shouldUseSideCaption(frame, crop);
            const panelClassName = [
              "comic-panel-card",
              "comic-panel-card-stacked",
              isCompact ? "comic-panel-card-compact" : "",
            ].filter(Boolean).join(" ");
            const panelStyle = getPanelCardStyle(crop);
            const panelMedia: ReactNode = crop ? (
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
            );
            const panelCaption = (
              <div className="comic-panel-caption">
                <p className="comic-panel-text">{formatComicText(frame, locale)}</p>
              </div>
            );
            return (
              <section className={panelClassName} style={panelStyle} key={frame.frame_id || `${passage.id}-frame-${index}`}>
                {frameHref ? (
                  <button type="button" className="comic-panel-link comic-panel-content" onClick={() => router.push(frameHref)}>
                    {panelMedia}
                    {panelCaption}
                  </button>
                ) : (
                  <div className="comic-panel-content">
                    {panelMedia}
                    {panelCaption}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : null}

      {frames.length && !usePinnedCaptions ? (
        <>
          <div className="comic-image-stage">
            <img className="passage-image" src={image.url} alt={image.alt} />
          </div>
          <div className="comic-reader-layout">
            {frames.map((frame, index) => {
              const frameHref = getFrameHref(routeParams, frame, passageHref);
              return (
                <section className="comic-frame-card" key={frame.frame_id || `${passage.id}-frame-${index}`}>
                  {frameHref ? (
                    <button type="button" className="comic-frame-link" onClick={() => router.push(frameHref)}>
                      <div className="comic-frame-text-list">
                        <p className="comic-frame-text">{formatComicText(frame, locale)}</p>
                      </div>
                    </button>
                  ) : (
                    <div className="comic-frame-text-list">
                      <p className="comic-frame-text">{formatComicText(frame, locale)}</p>
                    </div>
                  )}
                </section>
              );
            })}
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
