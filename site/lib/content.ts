import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";
import type { Chapter, ComicLayout, Passage, Review, Scene, SiteData } from "@/lib/types";

const REPO_ROOT = path.resolve(process.cwd(), "..");
const STORY_DIR = path.join(REPO_ROOT, "story");
const MEMORY_DIR = path.join(REPO_ROOT, "memory");

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

type ChapterFile = {
  source_title: string;
  adapted_title_cn: string;
  viewpoint?: string[];
  goal_cn: string;
  passage_count?: number;
  global_arc?: Record<string, unknown>;
};

async function readText(filePath: string): Promise<string> {
  return (await fs.readFile(filePath, "utf8")).trim();
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readText(filePath)) as T;
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

      // Standalone markers do not carry a payload length.
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

      // SOF markers contain image dimensions.
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

async function loadPassage(passageDir: string): Promise<Passage> {
  const passageText = await fs.readFile(path.join(passageDir, "passage.md"), "utf8");
  const passageMd = parseFrontmatterMarkdown(passageText);
  const frontmatter = passageMd.frontmatter;
  const spec = await readJson<StorySpec>(path.join(passageDir, "spec.json"));
  const currentDir = path.join(passageDir, "current");
  const latestDraftPath = await firstExistingPath([
    path.join(currentDir, "draft_cn.md"),
    (await latestVersionFile(passageDir, /^draft_cn_v\d+\.md$/)) ?? "",
  ]);
  const latestReviewPath = await firstExistingPath([
    path.join(currentDir, "draft_cn_review.json"),
    (await latestVersionFile(passageDir, /^draft_cn_v\d+_review\.json$/)) ?? "",
  ]);
  const latestApprovedPath = await firstExistingPath([
    path.join(currentDir, "approved_cn.md"),
    (await latestVersionFile(passageDir, /^cp.*_cn_v\d+\.md$/)) ?? "",
  ]);
  const imagePath = await firstExistingPath([
    path.join(currentDir, "image.png"),
    path.join(currentDir, "image.jpg"),
    path.join(currentDir, "image.jpeg"),
    path.join(currentDir, "image.webp"),
    (await latestVersionFile(passageDir, /^image\.(png|jpg|jpeg|webp)$/i)) ?? "",
  ]);
  const comicLayoutPath = await firstExistingPath([
    path.join(currentDir, "comic_reader_layout.json"),
    (await latestVersionFile(passageDir, /^comic_reader_layout_v\d+\.json$/)) ?? "",
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
  const imageMetadata = imagePath ? await readImageMetadata(imagePath) : { width: null, height: null };

  return {
    id: passageId,
    chapter_id: frontmatterString(frontmatter, "chapter_id"),
    passage_id: frontmatterString(frontmatter, "passage_id"),
    title,
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
      text: latestDraftPath ? await readText(latestDraftPath) : "",
    },
    approved_cn: {
      path: latestApprovedPath ? path.relative(passageDir, latestApprovedPath) : null,
      text: latestApprovedPath ? await readText(latestApprovedPath) : "",
    },
    image: imagePath
      ? {
          path: path.relative(passageDir, imagePath),
          url: `/api/story-image/${passageId}`,
          alt: `${title} image`,
          width: imageMetadata.width,
          height: imageMetadata.height,
        }
      : null,
    comic_layout: await loadComicLayout(comicLayoutPath),
    review: await loadReview(latestReviewPath),
    scenes: await loadSceneSpecs(passageDir),
    source: {
      path: sourcePath ? path.relative(REPO_ROOT, sourcePath) : null,
      text: sourceText,
    },
  };
}

async function loadChapter(chapterPath: string): Promise<Chapter> {
  const chapter = await readJson<ChapterFile>(chapterPath);
  const chapterSlug = path.basename(chapterPath, ".json");
  const storyEntries = await fs.readdir(STORY_DIR, { withFileTypes: true });
  const passageDirs = storyEntries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(`${chapterSlug}-p`))
    .map((entry) => path.join(STORY_DIR, entry.name))
    .sort();

  const passages = await Promise.all(passageDirs.map((dir) => loadPassage(dir)));

  return {
    id: chapterSlug,
    source_title: chapter.source_title,
    adapted_title_cn: chapter.adapted_title_cn,
    viewpoint: chapter.viewpoint ?? [],
    goal_cn: chapter.goal_cn,
    passage_count: chapter.passage_count ?? passages.length,
    global_arc: chapter.global_arc ?? {},
    passages,
  };
}

export const getSiteData = cache(async function getSiteData(): Promise<SiteData> {
  const storyEntries = await fs.readdir(STORY_DIR);
  const chapterFiles = storyEntries
    .filter((file) => /^cp\d+\.json$/.test(file))
    .sort()
    .map((file) => path.join(STORY_DIR, file));

  const chapters = await Promise.all(chapterFiles.map((file) => loadChapter(file)));
  const allPassages = chapters.flatMap((chapter) => chapter.passages);

  return {
    project: {
      title: "Sanguo Rewrite",
      subtitle: "A story-first rewrite of Romance of the Three Kingdoms",
      description:
        "A reading room for the current draft, and a studio window into the planning, review, and continuity logic behind each passage.",
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
        chapters: chapters.length,
        passages: allPassages.length,
        reviews: allPassages.filter((passage) => passage.review).length,
        approved_cn: allPassages.filter((passage) => passage.approved_cn.text).length,
      },
    },
    chapters,
    memory: {
      story_index: await readJson<SiteData["memory"]["story_index"]>(path.join(MEMORY_DIR, "story_index.json")),
      working_memory: await readJson<SiteData["memory"]["working_memory"]>(
        path.join(MEMORY_DIR, "working_memory.json")
      ),
    },
  };
});
