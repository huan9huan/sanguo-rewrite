import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";
import type { BookManifest, BookMeta, ChapterManifest, Passage, SiteData } from "@/lib/types";
import {
  getRepoAllBooks,
  getRepoAllPassages,
  getRepoBookById,
  getRepoChapterById,
  getRepoPassageById,
  getRepoPassageBySlugs,
  getRepoSiteData,
} from "@/lib/repo-content";

type ContentManifest = {
  version: string;
  generated_at: string;
  project: SiteData["project"];
  books: BookMeta[];
  memory: SiteData["memory"];
};

const LOCAL_CONTENT_DIR = path.join(process.cwd(), "public", "content");
const CONTENT_BASE_URL = process.env.CONTENT_BASE_URL?.replace(/\/$/, "") ?? null;

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readLocalJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function readRemoteJson<T>(relativePath: string): Promise<T> {
  if (!CONTENT_BASE_URL) {
    throw new Error("CONTENT_BASE_URL is not configured");
  }

  const response = await fetch(`${CONTENT_BASE_URL}/${relativePath}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch content: ${relativePath}`);
  }

  return (await response.json()) as T;
}

async function readExportJson<T>(relativePath: string): Promise<T | null> {
  const filePath = path.join(LOCAL_CONTENT_DIR, ...relativePath.split("/"));
  if (await fileExists(filePath)) {
    return readLocalJson<T>(filePath);
  }

  if (CONTENT_BASE_URL) {
    return readRemoteJson<T>(relativePath);
  }

  return null;
}

function resolveContentAssetUrl(relativePath: string): string {
  if (CONTENT_BASE_URL) {
    return `${CONTENT_BASE_URL}/${relativePath}`;
  }
  return `/content/${relativePath}`;
}

function hydratePassageAssets(passage: Passage): Passage {
  if (!passage.image?.path) {
    return passage;
  }

  return {
    ...passage,
    image: {
      ...passage.image,
      url: resolveContentAssetUrl(passage.image.path),
    },
  };
}

async function getExportManifest(): Promise<ContentManifest | null> {
  return readExportJson<ContentManifest>("manifest.json");
}

async function getExportedBook(bookId: string): Promise<BookManifest | null> {
  return readExportJson<BookManifest>(`books/${bookId}/manifest.json`);
}

async function getExportedChapter(bookId: string, chapterId: string): Promise<ChapterManifest | null> {
  return readExportJson<ChapterManifest>(`books/${bookId}/chapters/${chapterId}/manifest.json`);
}

async function getExportedPassage(bookId: string, chapterId: string, passageId: string): Promise<Passage | null> {
  const payload = await readExportJson<Passage>(`books/${bookId}/chapters/${chapterId}/passages/${passageId}.json`);
  return payload ? hydratePassageAssets(payload) : null;
}

export const getSiteData = cache(async function getSiteData(): Promise<SiteData> {
  const manifest = await getExportManifest();
  if (!manifest) {
    return getRepoSiteData();
  }

  const books = await Promise.all(
    manifest.books.map(async (book) => {
      const bookManifest = await getExportedBook(book.id);
      if (!bookManifest) {
        return null;
      }

      const chapters = await Promise.all(
        bookManifest.chapters.map(async (chapter) => {
          const passages = (
            await Promise.all(
              chapter.passage_ids.map((passageId) => getExportedPassage(book.id, chapter.id, passageId.split("-").pop() ?? passageId))
            )
          ).filter((passage): passage is Passage => Boolean(passage));

          return {
            ...chapter,
            passages,
          };
        })
      );

      return {
        ...bookManifest,
        chapters,
      };
    })
  );

  return {
    project: manifest.project,
    books: books.filter((book): book is SiteData["books"][number] => Boolean(book)),
    memory: manifest.memory,
  };
});

export const getAllBooks = cache(async function getAllBooks(): Promise<BookMeta[]> {
  const manifest = await getExportManifest();
  if (!manifest) {
    return getRepoAllBooks();
  }

  return manifest.books;
});

export const getBookById = cache(async function getBookById(bookId: string): Promise<BookManifest | null> {
  const exported = await getExportedBook(bookId);
  if (exported) {
    return exported;
  }

  return getRepoBookById(bookId);
});

export const getChapterById = cache(async function getChapterById(bookId: string, chapterId: string): Promise<ChapterManifest | null> {
  const exported = await getExportedChapter(bookId, chapterId);
  if (exported) {
    return exported;
  }

  return getRepoChapterById(bookId, chapterId);
});

export const getAllPassages = cache(async function getAllPassages(): Promise<Passage[]> {
  const data = await getSiteData();
  return data.books.flatMap((book) => book.chapters.flatMap((chapter) => chapter.passages));
});

export const getPassageById = cache(async function getPassageById(passageId: string): Promise<Passage | null> {
  const passages = await getAllPassages();
  const passage = passages.find((item) => item.id === passageId);
  if (passage) {
    return passage;
  }

  return getRepoPassageById(passageId);
});

export const getPassageBySlugs = cache(
  async function getPassageBySlugs(bookId: string, chapterId: string, passageId: string): Promise<Passage | null> {
    const exported = await getExportedPassage(bookId, chapterId, passageId);
    if (exported) {
      return exported;
    }

    return getRepoPassageBySlugs(bookId, chapterId, passageId);
  }
);
