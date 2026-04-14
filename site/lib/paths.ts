import type { Locale, PassageRouteParams } from "@/lib/types";

export function buildLibraryHref(locale?: Locale): string {
  const prefix = locale ? `/${locale}` : "";
  return `${prefix}/read`;
}

export function buildAboutHref(locale?: Locale): string {
  const prefix = locale ? `/${locale}` : "";
  return `${prefix}/about`;
}

export function buildBookHref(bookId: string, locale?: Locale): string {
  const prefix = locale ? `/${locale}` : "";
  return `${prefix}/read/${bookId}`;
}

export function buildChapterHref(bookId: string, chapterId: string, locale?: Locale): string {
  const prefix = locale ? `/${locale}` : "";
  return `${prefix}/read/${bookId}/${chapterId}`;
}

export function buildPassageHref({ bookId, chapterId, passageId }: PassageRouteParams, locale?: Locale): string {
  const prefix = locale ? `/${locale}` : "";
  return `${prefix}/read/${bookId}/${chapterId}/${passageId}`;
}

export function buildComicHref(params: PassageRouteParams, locale?: Locale): string {
  return `${buildPassageHref(params, locale)}/comic`;
}

export function buildSceneHref(params: PassageRouteParams, sceneId: string, frameId?: string, locale?: Locale): string {
  const searchParams = new URLSearchParams({ scene: sceneId });
  if (frameId) {
    searchParams.set("frame", frameId);
  }

  return `${buildPassageHref(params, locale)}?${searchParams.toString()}`;
}
