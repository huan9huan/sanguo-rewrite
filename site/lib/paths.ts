import type { PassageRouteParams } from "@/lib/types";

export function buildBookHref(bookId: string): string {
  return `/read/${bookId}`;
}

export function buildChapterHref(bookId: string, chapterId: string): string {
  return `/read/${bookId}/${chapterId}`;
}

export function buildPassageHref({ bookId, chapterId, passageId }: PassageRouteParams): string {
  return `/read/${bookId}/${chapterId}/${passageId}`;
}

export function buildComicHref(params: PassageRouteParams): string {
  return `${buildPassageHref(params)}/comic`;
}

export function buildSceneHref(params: PassageRouteParams, sceneId: string, frameId?: string): string {
  const searchParams = new URLSearchParams({ scene: sceneId });
  if (frameId) {
    searchParams.set("frame", frameId);
  }

  return `${buildPassageHref(params)}?${searchParams.toString()}`;
}
