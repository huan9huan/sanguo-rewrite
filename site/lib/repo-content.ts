import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";
import { buildPassageReadingModel } from "@/lib/reading-model";
import type {
  BookManifest,
  BookMeta,
  Chapter,
  ChapterManifest,
  ComicLayout,
  ComicPassageAlignment,
  Passage,
  PassageImage,
  PassagePreview,
  Review,
  Scene,
  SiteData,
} from "@/lib/types";

const REPO_ROOT = path.resolve(process.cwd(), "..");
const STORY_DIR = path.join(REPO_ROOT, "story");
const MEMORY_DIR = path.join(REPO_ROOT, "memory");
const BOOKS_FILE = path.join(STORY_DIR, "books.json");
const BOOKS_EN_FILE = path.join(STORY_DIR, "books.en.json");

const CURRENT_FILES = {
  draft: "draft_cn.md",
  review: "draft_cn_review.json",
  approved: "approved_cn.md",
  comicLayout: "comic.json",
  comicAlignment: "comic_alignment.json",
  comicImage: "comic.png",
} as const;

type FrontmatterValue = string | string[];
type Frontmatter = Record<string, FrontmatterValue>;
type ParsedFrontmatterMarkdown = {
  frontmatter: Frontmatter;
  body: string;
};

type StorySpec = {
  scene_id?: string;
  scene_type?: string;
  purpose_cn?: string;
  scene_goal_cn?: string;
  setting_cn?: string;
  characters?: string[];
  must_include?: string[];
  must_avoid?: string[];
  title_cn?: string;
  goal_cn?: string;
  dramatic_question_cn?: string;
  emotion_curve?: string[];
  hook_cn?: string;
  conflict_cn?: string;
  turn_cn?: string;
  ending_hook_cn?: string;
  source_text_range?: string;
  viewpoint_focus?: string[];
  status?: string;
};

type ComicLayoutFile = {
  page_id: string;
  version: number;
  viewport_mode?: string;
  frame_aspect_ratio?: string;
  frames?: Array<{
    frame_id?: string;
    scene_id?: string;
    panel_box?: {
      x?: number;
      y?: number;
      w?: number;
      h?: number;
    };
    text_block?: {
      title?: string;
      items?: Array<{
        id?: string;
        kind?: string;
        speaker?: string;
        text?: string;
        lang?: string;
      }>;
    };
  }>;
};

type ReviewFile = {
  version: number;
  overall_verdict: string;
  summary: string;
  strengths?: string[];
  issues?: Review["issues"];
  scene_coverage?: Record<string, unknown>;
  spec_compliance?: Record<string, unknown>;
};

type ComicPassageAlignmentFile = ComicPassageAlignment;

type ChapterFile = {
  source_title: string;
  adapted_title_cn: string;
  viewpoint?: string[];
  goal_cn: string;
  passage_count?: number;
  global_arc?: Record<string, unknown>;
};

type ChapterEnFile = {
  id?: string;
  display_title?: string;
  summary?: string;
};

type BookConfig = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  total_chapter_count?: number | null;
  chapter_ids: string[];
};

async function readText(filePath: string): Promise<string> {
  return (await fs.readFile(filePath, "utf8")).trim();
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readText(filePath)) as T;
}

function getPassageTeaser(text: string): string {
  const cleaned = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .find((line) => !line.startsWith("#"));

  if (!cleaned) {
    return "";
  }

  const sentence = cleaned.match(/^.+?[。！？!?]/)?.[0] ?? cleaned;
  return sentence.length > 56 ? `${sentence.slice(0, 56).trim()}...` : sentence;
}

async function loadBooksConfig(): Promise<BookConfig[]> {
  return readJson<BookConfig[]>(BOOKS_FILE);
}

async function readImageMetadata(filePath: string): Promise<{ width: number | null; height: number | null }> {
  const buffer = await fs.readFile(filePath);
  const pngSignature = "89504e470d0a1a0a";
  if (buffer.length >= 24 && buffer.subarray(0, 8).toString("hex") === pngSignature) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = buffer[offset + 1];
      offset += 2;

      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
        continue;
      }

      if (offset + 2 > buffer.length) {
        break;
      }

      const segmentLength = buffer.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > buffer.length) {
        break;
      }

      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        if (segmentLength >= 7) {
          return {
            height: buffer.readUInt16BE(offset + 3),
            width: buffer.readUInt16BE(offset + 5),
          };
        }
        break;
      }

      offset += segmentLength;
    }
  }
  return { width: null, height: null };
}

function parseFrontmatterMarkdown(text: string): ParsedFrontmatterMarkdown {
  const result: ParsedFrontmatterMarkdown = { frontmatter: {}, body: text.trim() };
  if (!text.startsWith("---\n")) {
    return result;
  }

  const parts = text.split("---\n");
  if (parts.length < 3) {
    return result;
  }

  const frontmatterBlock = parts[1];
  const body = parts.slice(2).join("---\n");
  const lines = frontmatterBlock.split("\n");
  const frontmatter: Frontmatter = {};
  let currentKey: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line) continue;

    if (line.startsWith("- ") || line.startsWith("  - ")) {
      if (currentKey) {
        const currentValue = frontmatter[currentKey];
        if (!Array.isArray(currentValue)) {
          frontmatter[currentKey] = [];
        }
        (frontmatter[currentKey] as string[]).push(line.replace(/^\s*-\s*/, "").trim());
      }
      continue;
    }

    const splitIndex = line.indexOf(":");
    if (splitIndex === -1) continue;

    const key = line.slice(0, splitIndex).trim();
    const value = line.slice(splitIndex + 1).trim();
    currentKey = key;
    frontmatter[key] = value || [];
  }

  return { frontmatter, body: body.trim() };
}

function frontmatterString(frontmatter: Frontmatter, key: string): string {
  const value = frontmatter[key];
  return typeof value === "string" ? value : "";
}

function extractSection(body: string, heading: string): string {
  const pattern = new RegExp(`^## ${heading}\\s*$`, "m");
  const match = body.match(pattern);
  if (!match || match.index == null) {
    return "";
  }

  const start = match.index + match[0].length;
  const rest = body.slice(start);
  const nextMatch = rest.match(/^## .+$/m);
  const end = nextMatch && nextMatch.index != null ? start + nextMatch.index : body.length;
  return body.slice(start, end).trim();
}

function extractVersionNumber(fileName: string): number {
  const match = fileName.match(/_v(\d+)/);
  return match ? Number(match[1]) : 0;
}

async function latestVersionFile(directory: string, matcher: RegExp): Promise<string | null> {
  const files = await fs.readdir(directory);
  const matched = files.filter((file) => matcher.test(file));
  if (!matched.length) {
    return null;
  }

  matched.sort((a, b) => extractVersionNumber(a) - extractVersionNumber(b));
  return path.join(directory, matched[matched.length - 1]);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function firstExistingPath(paths: string[]): Promise<string | null> {
  for (const candidate of paths) {
    if (!candidate) continue;
    if (await fileExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function loadSceneSpecs(passageDir: string): Promise<Scene[]> {
  const files = (await fs.readdir(passageDir))
    .filter((file) => /^s\d+-spec\.json$/.test(file))
    .sort();

  return Promise.all(
    files.map(async (file) => {
      const scene = await readJson<StorySpec>(path.join(passageDir, file));
      return {
        id: scene.scene_id ?? "",
        type: scene.scene_type ?? "",
        purpose: scene.purpose_cn ?? "",
        goal: scene.scene_goal_cn ?? "",
        setting: scene.setting_cn ?? "",
        characters: scene.characters ?? [],
        must_include: scene.must_include ?? [],
        must_avoid: scene.must_avoid ?? [],
      };
    })
  );
}

async function loadReview(reviewPath: string | null): Promise<Review | null> {
  if (!reviewPath) {
    return null;
  }

  const review = await readJson<ReviewFile>(reviewPath);
  return {
    version: review.version,
    verdict: review.overall_verdict,
    summary: review.summary,
    strengths: review.strengths ?? [],
    issues: review.issues ?? [],
    scene_coverage: review.scene_coverage ?? {},
    spec_compliance: review.spec_compliance ?? {},
  };
}

async function loadComicLayout(layoutPath: string | null): Promise<ComicLayout | null> {
  if (!layoutPath) {
    return null;
  }

  const layout = await readJson<ComicLayoutFile>(layoutPath);
  return {
    page_id: layout.page_id,
    version: layout.version,
    viewport_mode: layout.viewport_mode ?? "",
    frame_aspect_ratio: layout.frame_aspect_ratio ?? "",
    frames: (layout.frames ?? []).map((frame) => ({
      frame_id: frame.frame_id ?? "",
      scene_id: frame.scene_id ?? "",
      title: frame.text_block?.title ?? "",
      items: (frame.text_block?.items ?? []).map((item) => ({
        id: item.id ?? "",
        kind: item.kind ?? "",
        speaker: item.speaker ?? "",
        text: item.text ?? "",
        lang: item.lang ?? "",
      })),
      panel_box: frame.panel_box
        ? {
            x: frame.panel_box.x ?? 0,
            y: frame.panel_box.y ?? 0,
            w: frame.panel_box.w ?? 0,
            h: frame.panel_box.h ?? 0,
          }
        : undefined,
    })),
  };
}

async function loadComicAlignment(alignmentPath: string | null): Promise<ComicPassageAlignment | null> {
  if (!alignmentPath) {
    return null;
  }

  return readJson<ComicPassageAlignmentFile>(alignmentPath);
}

function buildPassagePreview(passage: Passage): PassagePreview {
  return {
    id: passage.id,
    book_id: passage.book_id,
    chapter_id: passage.chapter_id,
    passage_id: passage.passage_id,
    title: passage.title,
    short_title: passage.short_title,
    catchup: passage.catchup,
    status: passage.status,
    summary_markdown: passage.summary_markdown,
    teaser: getPassageTeaser(passage.reading.text),
    has_comic: Boolean(passage.reading.comic.image || passage.reading.comic.layout?.frames?.length),
    image: passage.reading.comic.image,
    available_locales: passage.available_locales,
    title_en: passage.localized?.en?.title || undefined,
    catchup_en: passage.localized?.en?.catchup || undefined,
  };
}

async function loadPassage(passageDir: string, bookId: string): Promise<Passage> {
  const passageText = await fs.readFile(path.join(passageDir, "passage.md"), "utf8");
  const passageMd = parseFrontmatterMarkdown(passageText);
  const frontmatter = passageMd.frontmatter;
  const spec = await readJson<StorySpec>(path.join(passageDir, "spec.json"));
  const currentDir = path.join(passageDir, "current");
  const latestDraftPath = await firstExistingPath([
    path.join(currentDir, CURRENT_FILES.draft),
    (await latestVersionFile(passageDir, /^draft_cn_v\d+\.md$/)) ?? "",
  ]);
  const latestReviewPath = await firstExistingPath([
    path.join(currentDir, CURRENT_FILES.review),
    (await latestVersionFile(passageDir, /^draft_cn_v\d+_review\.json$/)) ?? "",
  ]);
  const latestApprovedPath = await firstExistingPath([
    path.join(currentDir, CURRENT_FILES.approved),
    (await latestVersionFile(passageDir, /^cp.*_cn_v\d+\.md$/)) ?? "",
  ]);
  const imagePath = await firstExistingPath([
    path.join(currentDir, CURRENT_FILES.comicImage),
    (await latestVersionFile(passageDir, /^image\.(png|jpg|jpeg|webp)$/i)) ?? "",
  ]);
  const comicLayoutPath = await firstExistingPath([
    path.join(currentDir, CURRENT_FILES.comicLayout),
    (await latestVersionFile(passageDir, /^comic_reader_layout_v\d+\.json$/)) ?? "",
  ]);
  const comicAlignmentPath = await firstExistingPath([
    path.join(currentDir, CURRENT_FILES.comicAlignment),
  ]);
  const sourceRef = frontmatterString(frontmatter, "source_file");
  const sourcePath = sourceRef ? path.resolve(passageDir, sourceRef) : null;

  let sourceText = "";
  if (sourcePath) {
    const sourceMd = parseFrontmatterMarkdown(await fs.readFile(sourcePath, "utf8"));
    sourceText = extractSection(sourceMd.body, "Source") || sourceMd.body;
  }

  const passageId = frontmatterString(frontmatter, "id") || path.basename(passageDir);
  const title = frontmatterString(frontmatter, "title") || spec.title_cn || path.basename(passageDir);
  const shortTitle = frontmatterString(frontmatter, "short_title") || title;
  const imageMetadata = imagePath ? await readImageMetadata(imagePath) : { width: null, height: null };
  const draftText = latestDraftPath ? await readText(latestDraftPath) : "";
  const approvedText = latestApprovedPath ? await readText(latestApprovedPath) : "";
  const scenes = await loadSceneSpecs(passageDir);
  const comicLayout = await loadComicLayout(comicLayoutPath);
  const comicAlignment = await loadComicAlignment(comicAlignmentPath);
  const image: PassageImage | null = imagePath
    ? {
        path: path.relative(passageDir, imagePath),
        url: `/api/story-image/${passageId}`,
        alt: `${title} image`,
        width: imageMetadata.width,
        height: imageMetadata.height,
      }
    : null;
  const reading = buildPassageReadingModel({
    draftText,
    approvedText,
    image,
    comicLayout,
    comicAlignment,
    passageId,
    scenes,
  });

  return {
    id: passageId,
    book_id: bookId,
    chapter_id: frontmatterString(frontmatter, "chapter_id"),
    passage_id: frontmatterString(frontmatter, "passage_id"),
    title,
    short_title: shortTitle,
    catchup: frontmatterString(frontmatter, "catchup") || getPassageTeaser(reading.text),
    status: frontmatterString(frontmatter, "status") || spec.status || "draft",
    summary_markdown: extractSection(passageMd.body, "Summary"),
    scene_plan_markdown: extractSection(passageMd.body, "Scene Plan"),
    source_note_markdown: extractSection(passageMd.body, "Source"),
    spec: {
      title_cn: spec.title_cn ?? "",
      goal_cn: spec.goal_cn ?? "",
      dramatic_question_cn: spec.dramatic_question_cn ?? "",
      emotion_curve: spec.emotion_curve ?? [],
      hook_cn: spec.hook_cn ?? "",
      conflict_cn: spec.conflict_cn ?? "",
      turn_cn: spec.turn_cn ?? "",
      ending_hook_cn: spec.ending_hook_cn ?? "",
      source_text_range: spec.source_text_range ?? "",
      must_include: spec.must_include ?? [],
      must_avoid: spec.must_avoid ?? [],
      viewpoint_focus: spec.viewpoint_focus ?? [],
    },
    draft: {
      path: latestDraftPath ? path.relative(passageDir, latestDraftPath) : null,
      text: draftText,
    },
    approved_cn: {
      path: latestApprovedPath ? path.relative(passageDir, latestApprovedPath) : null,
      text: approvedText,
    },
    reading,
    available_locales: ["zh"] as const,
    localized: {
      zh: { title, short_title: shortTitle, catchup: frontmatterString(frontmatter, "catchup") || getPassageTeaser(reading.text), reading },
    },
    review: await loadReview(latestReviewPath),
    scenes,
    source: {
      path: sourcePath ? path.relative(REPO_ROOT, sourcePath) : null,
      text: sourceText,
    },
  };
}

async function loadChapterEnOverlay(chapterSlug: string): Promise<ChapterEnFile | null> {
  const overlayPath = path.join(STORY_DIR, `${chapterSlug}.en.json`);
  if (await fileExists(overlayPath)) {
    return readJson<ChapterEnFile>(overlayPath);
  }
  return null;
}

async function loadChapter(chapterPath: string, bookId: string): Promise<Chapter> {
  const chapter = await readJson<ChapterFile>(chapterPath);
  const chapterSlug = path.basename(chapterPath, ".json");
  const chapterEn = await loadChapterEnOverlay(chapterSlug);
  const storyEntries = await fs.readdir(STORY_DIR, { withFileTypes: true });
  const passageDirs = storyEntries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(`${chapterSlug}-p`))
    .map((entry) => path.join(STORY_DIR, entry.name))
    .sort();

  const passages = await Promise.all(passageDirs.map((dir) => loadPassage(dir, bookId)));

  return {
    id: chapterSlug,
    book_id: bookId,
    source_title: chapter.source_title,
    adapted_title_cn: chapter.adapted_title_cn,
    display_title_en: chapterEn?.display_title ?? "",
    summary_en: chapterEn?.summary ?? "",
    viewpoint: chapter.viewpoint ?? [],
    goal_cn: chapter.goal_cn,
    passage_count: chapter.passage_count ?? passages.length,
    global_arc: chapter.global_arc ?? {},
    passage_ids: passages.map((passage) => passage.id),
    passages,
  };
}

type BooksEnFile = {
  project?: {
    title?: string;
    subtitle?: string;
    description?: string;
  };
  books?: Record<string, {
    title?: string;
    subtitle?: string;
    description?: string;
  }>;
};

async function loadBooksEnOverlay(): Promise<BooksEnFile | null> {
  if (await fileExists(BOOKS_EN_FILE)) {
    return readJson<BooksEnFile>(BOOKS_EN_FILE);
  }
  return null;
}

export const getRepoSiteData = cache(async function getRepoSiteData(): Promise<SiteData> {
  const booksConfig = await loadBooksConfig();
  const booksEn = await loadBooksEnOverlay();
  const booksEnMap = booksEn?.books ?? {};
  const books = await Promise.all(
    booksConfig.map(async (book) => {
      const bookEn = booksEnMap[book.id] ?? null;
      const chapters = await Promise.all(
        book.chapter_ids.map((chapterId) => loadChapter(path.join(STORY_DIR, `${chapterId}.json`), book.id))
      );

      return {
        id: book.id,
        title: book.title,
        subtitle: book.subtitle,
        description: book.description,
        title_en: bookEn?.title ?? "",
        subtitle_en: bookEn?.subtitle ?? "",
        description_en: bookEn?.description ?? "",
        total_chapter_count: book.total_chapter_count ?? null,
        available_chapter_count: chapters.length,
        chapter_ids: chapters.map((chapter) => chapter.id),
        chapter_count: chapters.length,
        chapters,
      };
    })
  );
  const allPassages = books.flatMap((book) => book.chapters.flatMap((chapter) => chapter.passages));
  const allChapters = books.flatMap((book) => book.chapters);

  return {
    project: {
      title: "三国演义",
      subtitle: "让三国故事更好读，更有画面",
      title_en: booksEn?.project?.title ?? "",
      subtitle_en: booksEn?.project?.subtitle ?? "",
      description_en: booksEn?.project?.description ?? "",
      description:
        "当前中文重写稿的阅读空间，也展示每一节背后的规划、评审与一致性记忆。",
      principles: [
        "Story first, culture implicit",
        "Character attachment over explanation",
        "Simple Chinese draft before English rewrite",
        "Passage-by-passage production with review gates",
      ],
      pipeline: [
        "Source chapter",
        "ChapterSpec",
        "PassageSpec",
        "Scene specs",
        "Chinese draft",
        "Review",
        "Revision",
        "English rewrite",
      ],
      stats: {
        chapters: allChapters.length,
        passages: allPassages.length,
        reviews: allPassages.filter((passage) => passage.review).length,
        approved_cn: allPassages.filter((passage) => passage.approved_cn.text).length,
        approved_en: 0,
      },
    },
    books,
    memory: {
      story_index: await readJson<SiteData["memory"]["story_index"]>(path.join(MEMORY_DIR, "story_index.json")),
      working_memory: await readJson<SiteData["memory"]["working_memory"]>(
        path.join(MEMORY_DIR, "working_memory.json")
      ),
    },
  };
});

export const getRepoAllBooks = cache(async function getRepoAllBooks(): Promise<BookMeta[]> {
  const data = await getRepoSiteData();
  return data.books.map((book) => ({
    id: book.id,
    title: book.title,
    subtitle: book.subtitle,
    description: book.description,
    title_en: book.title_en,
    subtitle_en: book.subtitle_en,
    description_en: book.description_en,
    total_chapter_count: book.total_chapter_count,
    available_chapter_count: book.available_chapter_count,
    chapter_ids: book.chapter_ids,
    chapter_count: book.chapter_count,
  }));
});

export const getRepoBookById = cache(async function getRepoBookById(bookId: string): Promise<BookManifest | null> {
  const data = await getRepoSiteData();
  const book = data.books.find((item) => item.id === bookId);
  if (!book) {
    return null;
  }

  return {
    id: book.id,
    title: book.title,
    subtitle: book.subtitle,
    description: book.description,
    title_en: book.title_en,
    subtitle_en: book.subtitle_en,
    description_en: book.description_en,
    total_chapter_count: book.total_chapter_count,
    available_chapter_count: book.available_chapter_count,
    chapter_ids: book.chapter_ids,
    chapter_count: book.chapter_count,
    chapters: book.chapters.map((chapter) => ({
      id: chapter.id,
      book_id: chapter.book_id,
      source_title: chapter.source_title,
      adapted_title_cn: chapter.adapted_title_cn,
      display_title_en: chapter.display_title_en,
      summary_en: chapter.summary_en,
      viewpoint: chapter.viewpoint,
      goal_cn: chapter.goal_cn,
      passage_count: chapter.passage_count,
      global_arc: chapter.global_arc,
      passage_ids: chapter.passage_ids,
    })),
  };
});

export const getRepoChapterById = cache(
  async function getRepoChapterById(bookId: string, chapterId: string): Promise<ChapterManifest | null> {
    const data = await getRepoSiteData();
    const book = data.books.find((item) => item.id === bookId);
    const chapter = book?.chapters.find((item) => item.id === chapterId);
    if (!chapter) {
      return null;
    }

    return {
      id: chapter.id,
      book_id: chapter.book_id,
      source_title: chapter.source_title,
      adapted_title_cn: chapter.adapted_title_cn,
      display_title_en: chapter.display_title_en,
      summary_en: chapter.summary_en,
      viewpoint: chapter.viewpoint,
      goal_cn: chapter.goal_cn,
      passage_count: chapter.passage_count,
      global_arc: chapter.global_arc,
      passage_ids: chapter.passage_ids,
      passages: chapter.passages.map((passage) => buildPassagePreview(passage)),
    };
  }
);

export const getRepoAllPassages = cache(async function getRepoAllPassages(): Promise<Passage[]> {
  const data = await getRepoSiteData();
  return data.books.flatMap((book) => book.chapters.flatMap((chapter) => chapter.passages));
});

export const getRepoPassageById = cache(async function getRepoPassageById(passageId: string): Promise<Passage | null> {
  const passages = await getRepoAllPassages();
  return passages.find((passage) => passage.id === passageId) ?? null;
});

export const getRepoPassageBySlugs = cache(
  async function getRepoPassageBySlugs(bookId: string, chapterId: string, passageId: string): Promise<Passage | null> {
    const data = await getRepoSiteData();
    return (
      data.books
        .find((book) => book.id === bookId)
        ?.chapters.find((chapterItem) => chapterItem.id === chapterId)
        ?.passages.find((passage) => passage.passage_id === passageId) ?? null
    );
  }
);
