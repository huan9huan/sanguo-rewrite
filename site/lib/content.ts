import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";
import type { Chapter, Passage, SiteData } from "@/lib/types";
import { getRepoAllPassages, getRepoPassageById, getRepoSiteData } from "@/lib/repo-content";

type ContentManifestChapter = Omit<Chapter, "passages"> & {
  passage_ids: string[];
};

type ContentManifest = {
  version: string;
  generated_at: string;
  project: SiteData["project"];
  chapters: ContentManifestChapter[];
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
  if (CONTENT_BASE_URL) {
    return readRemoteJson<T>(relativePath);
  }

  const filePath = path.join(LOCAL_CONTENT_DIR, ...relativePath.split("/"));
  if (!(await fileExists(filePath))) {
    return null;
  }

  return readLocalJson<T>(filePath);
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

async function getExportedPassage(passageId: string): Promise<Passage | null> {
  const payload = await readExportJson<Passage>(`passages/${passageId}.json`);
  return payload ? hydratePassageAssets(payload) : null;
}

export const getSiteData = cache(async function getSiteData(): Promise<SiteData> {
  const manifest = await getExportManifest();
  if (!manifest) {
    return getRepoSiteData();
  }

  const chapters = await Promise.all(
    manifest.chapters.map(async (chapter) => {
      const passages = (
        await Promise.all(chapter.passage_ids.map((passageId) => getExportedPassage(passageId)))
      ).filter((passage): passage is Passage => Boolean(passage));

      return {
        ...chapter,
        passages,
      };
    })
  );

  return {
    project: manifest.project,
    chapters,
    memory: manifest.memory,
  };
});

export const getAllPassages = cache(async function getAllPassages(): Promise<Passage[]> {
  const manifest = await getExportManifest();
  if (!manifest) {
    return getRepoAllPassages();
  }

  const passages = await Promise.all(
    manifest.chapters.flatMap((chapter) => chapter.passage_ids).map((passageId) => getExportedPassage(passageId))
  );

  return passages.filter((passage): passage is Passage => Boolean(passage));
});

export const getPassageById = cache(async function getPassageById(passageId: string): Promise<Passage | null> {
  const exported = await getExportedPassage(passageId);
  if (exported) {
    return exported;
  }

  return getRepoPassageById(passageId);
});
