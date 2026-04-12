import { promises as fs } from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { buildPassageReadingModel } from "../lib/reading-model-core.mjs";

const SITE_ROOT = process.cwd();
const REPO_ROOT = path.resolve(SITE_ROOT, "..");
const STORY_DIR = path.join(REPO_ROOT, "story");
const MEMORY_DIR = path.join(REPO_ROOT, "memory");
const BOOKS_FILE = path.join(STORY_DIR, "books.json");
const CONTENT_DIR = path.join(SITE_ROOT, "public", "content");
const BOOKS_DIR = path.join(CONTENT_DIR, "books");
const CURRENT_FILES = {
  draft: "draft_cn.md",
  review: "draft_cn_review.json",
  approved: "approved_cn.md",
  approvedEn: "approved_en.md",
  comicLayout: "comic.json",
  comicTextEn: "comic_text_en.json",
  comicAlignment: "comic_alignment.json",
  comicImage: "comic.png",
};

function requireMagick() {
  try {
    return execFileSync("which", ["magick"], { encoding: "utf8" }).trim();
  } catch {
    throw new Error("ImageMagick CLI `magick` is required for content export.");
  }
}

function exportWebImage(sourcePath, targetPath) {
  const magick = requireMagick();
  execFileSync(
    magick,
    [
      sourcePath,
      "-auto-orient",
      "-strip",
      "-colorspace",
      "sRGB",
      "-resize",
      "1800x>",
      "-quality",
      "82",
      targetPath,
    ],
    { stdio: "ignore" }
  );
}

function getPassageTeaser(text) {
  const cleaned = String(text ?? "")
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

function normalizeText(text) {
  return String(text ?? "").trim();
}

async function readText(filePath) {
  return normalizeText(await fs.readFile(filePath, "utf8"));
}

async function readJson(filePath) {
  return JSON.parse(await readText(filePath));
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(filePath) {
  await fs.mkdir(filePath, { recursive: true });
}

function parseFrontmatterMarkdown(text) {
  const result = { frontmatter: {}, body: normalizeText(text) };
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
  const frontmatter = {};
  let currentKey = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line) continue;

    if (line.startsWith("- ") || line.startsWith("  - ")) {
      if (currentKey) {
        const currentValue = frontmatter[currentKey];
        if (!Array.isArray(currentValue)) {
          frontmatter[currentKey] = [];
        }
        frontmatter[currentKey].push(line.replace(/^\s*-\s*/, "").trim());
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

  return { frontmatter, body: normalizeText(body) };
}

function frontmatterString(frontmatter, key) {
  const value = frontmatter[key];
  return typeof value === "string" ? value : "";
}

function extractSection(body, heading) {
  const pattern = new RegExp(`^## ${heading}\\s*$`, "m");
  const match = body.match(pattern);
  if (!match || match.index == null) {
    return "";
  }

  const start = match.index + match[0].length;
  const rest = body.slice(start);
  const nextMatch = rest.match(/^## .+$/m);
  const end = nextMatch && nextMatch.index != null ? start + nextMatch.index : body.length;
  return normalizeText(body.slice(start, end));
}

function extractVersionNumber(fileName) {
  const match = fileName.match(/_v(\d+)/);
  return match ? Number(match[1]) : 0;
}

async function latestVersionFile(directory, matcher) {
  const files = await fs.readdir(directory);
  const matched = files.filter((file) => matcher.test(file));
  if (!matched.length) {
    return null;
  }

  matched.sort((a, b) => extractVersionNumber(a) - extractVersionNumber(b));
  return path.join(directory, matched[matched.length - 1]);
}

async function firstExistingPath(paths) {
  for (const candidate of paths) {
    if (!candidate) continue;
    if (await fileExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function readImageMetadata(filePath) {
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

async function loadSceneSpecs(passageDir) {
  const files = (await fs.readdir(passageDir))
    .filter((file) => /^s\d+-spec\.json$/.test(file))
    .sort();

  return Promise.all(
    files.map(async (file) => {
      const scene = await readJson(path.join(passageDir, file));
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

async function loadReview(reviewPath) {
  if (!reviewPath) {
    return null;
  }

  const review = await readJson(reviewPath);
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

async function loadComicLayout(layoutPath) {
  if (!layoutPath) {
    return null;
  }

  const layout = await readJson(layoutPath);
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

async function loadComicAlignment(alignmentPath) {
  if (!alignmentPath) {
    return null;
  }

  return readJson(alignmentPath);
}

function mergeEnglishComicOverlay(baseLayout, enOverlay) {
  if (!baseLayout || !enOverlay) {
    return baseLayout;
  }

  const enFrameMap = new Map(
    (enOverlay.frames ?? []).map((frame) => [frame.frame_id, frame])
  );

  return {
    ...baseLayout,
    frames: baseLayout.frames.map((baseFrame) => {
      const enFrame = enFrameMap.get(baseFrame.frame_id);
      if (!enFrame) {
        return baseFrame;
      }

      const enItemMap = new Map(
        (enFrame.items ?? []).map((item) => [item.id, item])
      );

      return {
        ...baseFrame,
        title: enFrame.title ?? baseFrame.title,
        items: baseFrame.items.map((baseItem) => {
          const enItem = enItemMap.get(baseItem.id);
          if (!enItem) {
            return baseItem;
          }
          return {
            ...baseItem,
            text: enItem.text ?? baseItem.text,
            speaker: enItem.speaker ?? baseItem.speaker,
            lang: "en",
          };
        }),
      };
    }),
  };
}

async function loadBooksConfig() {
  return readJson(BOOKS_FILE);
}

function buildPassagePreview(payload) {
  return {
    id: payload.id,
    book_id: payload.book_id,
    chapter_id: payload.chapter_id,
    passage_id: payload.passage_id,
    title: payload.title,
    short_title: payload.short_title,
    catchup: payload.catchup,
    status: payload.status,
    summary_markdown: payload.summary_markdown,
    teaser: getPassageTeaser(payload.reading.text),
    has_comic: Boolean(payload.reading.comic.image || payload.reading.comic.layout?.frames?.length),
    image: payload.reading.comic.image,
    available_locales: payload.available_locales,
    title_en: payload.localized?.en?.title || undefined,
    catchup_en: payload.localized?.en?.catchup || undefined,
  };
}

async function exportPassage(passageDir, book) {
  const passageText = await fs.readFile(path.join(passageDir, "passage.md"), "utf8");
  const passageMd = parseFrontmatterMarkdown(passageText);
  const frontmatter = passageMd.frontmatter;
  const spec = await readJson(path.join(passageDir, "spec.json"));
  const currentDir = path.join(passageDir, "current");

  const latestDraftPath = await firstExistingPath([
    path.join(currentDir, CURRENT_FILES.draft),
    await latestVersionFile(passageDir, /^draft_cn_v\d+\.md$/),
  ]);
  const latestReviewPath = await firstExistingPath([
    path.join(currentDir, CURRENT_FILES.review),
    await latestVersionFile(passageDir, /^draft_cn_v\d+_review\.json$/),
  ]);
  const latestApprovedPath = await firstExistingPath([
    path.join(currentDir, CURRENT_FILES.approved),
    await latestVersionFile(passageDir, /^cp.*_cn_v\d+\.md$/),
  ]);
  const imagePath = await firstExistingPath([
    path.join(currentDir, CURRENT_FILES.comicImage),
    await latestVersionFile(passageDir, /^image\.(png|jpg|jpeg|webp)$/i),
  ]);
  const comicLayoutPath = await firstExistingPath([
    path.join(currentDir, CURRENT_FILES.comicLayout),
    await latestVersionFile(passageDir, /^comic_reader_layout_v\d+\.json$/),
  ]);
  const comicAlignmentPath = await firstExistingPath([
    path.join(currentDir, CURRENT_FILES.comicAlignment),
  ]);
  const approvedEnPath = await firstExistingPath([
    path.join(currentDir, CURRENT_FILES.approvedEn),
    await latestVersionFile(passageDir, /^cp.*_en_v\d+\.md$/),
  ]);
  const comicTextEnPath = await firstExistingPath([
    path.join(currentDir, CURRENT_FILES.comicTextEn),
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
  const draftText = latestDraftPath ? await readText(latestDraftPath) : "";
  const approvedText = latestApprovedPath ? await readText(latestApprovedPath) : "";
  const scenes = await loadSceneSpecs(passageDir);
  const comicLayout = await loadComicLayout(comicLayoutPath);
  const comicAlignment = await loadComicAlignment(comicAlignmentPath);
  const comicTextEn = comicTextEnPath ? await readJson(comicTextEnPath) : null;

  if (comicTextEn && comicLayoutPath) {
    const rawComic = await readJson(comicLayoutPath);
    const hasEmbeddedEn = (rawComic.frames ?? []).some(
      (f) => (f.text_block?.title_en ?? "") !== "" || (f.text_block?.items ?? []).some((item) => (item.lang ?? "") === "en")
    );
    if (hasEmbeddedEn) {
      console.warn(`[drift] ${passageId}: comic.json has embedded English but comic_text_en.json also exists — clean up comic.json`);
    }
  }

  let exportedImage = null;
  if (imagePath) {
    const targetRelativePath = `books/${book.id}/chapters/${frontmatterString(frontmatter, "chapter_id")}/assets/${frontmatterString(frontmatter, "passage_id")}.webp`;
    const targetAbsolutePath = path.join(CONTENT_DIR, targetRelativePath);
    await ensureDir(path.dirname(targetAbsolutePath));
    exportWebImage(imagePath, targetAbsolutePath);
    const imageMetadata = await readImageMetadata(imagePath);
    exportedImage = {
      path: targetRelativePath,
      url: `/${targetRelativePath}`,
      alt: `${title} image`,
      width: imageMetadata.width,
      height: imageMetadata.height,
    };
  }

  const reading = buildPassageReadingModel({
    draftText,
    approvedText,
    image: exportedImage,
    comicLayout,
    comicAlignment,
    passageId,
    scenes,
  });

  const approvedEnText = approvedEnPath ? await readText(approvedEnPath) : "";
  const enTitle = approvedEnText ? approvedEnText.split("\n").find((line) => line.startsWith("# "))?.replace(/^# /, "") || title : title;
  const enComicLayout = mergeEnglishComicOverlay(comicLayout, comicTextEn);
  const enReading = approvedEnText
    ? buildPassageReadingModel({
        draftText: "",
        approvedText: approvedEnText,
        sourceLabel: "approved_en",
        image: exportedImage,
        comicLayout: enComicLayout,
        comicAlignment,
        passageId,
        scenes,
      })
    : null;

  const availableLocales = ["zh"];
  if (enReading) {
    availableLocales.push("en");
  }

  const localized = {};
  localized.zh = { title, short_title: shortTitle, catchup: frontmatterString(frontmatter, "catchup") || getPassageTeaser(reading.text), reading };
  if (enReading) {
    localized.en = { title: enTitle, short_title: enTitle, catchup: getPassageTeaser(enReading.text), reading: enReading };
  }

  const payload = {
    id: passageId,
    book_id: book.id,
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
    available_locales: availableLocales,
    localized,
    review: await loadReview(latestReviewPath),
    scenes,
    source: {
      path: sourcePath ? path.relative(REPO_ROOT, sourcePath) : null,
      text: sourceText,
    },
  };

  const targetPath = path.join(
    BOOKS_DIR,
    book.id,
    "chapters",
    payload.chapter_id,
    "passages",
    `${payload.passage_id}.json`
  );
  await ensureDir(path.dirname(targetPath));
  await fs.writeFile(targetPath, `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

async function exportChapter(chapterPath, book) {
  const chapter = await readJson(chapterPath);
  const chapterSlug = path.basename(chapterPath, ".json");
  const storyEntries = await fs.readdir(STORY_DIR, { withFileTypes: true });
  const passageDirs = storyEntries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(`${chapterSlug}-p`))
    .map((entry) => path.join(STORY_DIR, entry.name))
    .sort();

  const passages = await Promise.all(passageDirs.map((dir) => exportPassage(dir, book)));
  const chapterManifest = {
    id: chapterSlug,
    book_id: book.id,
    source_title: chapter.source_title,
    adapted_title_cn: chapter.adapted_title_cn,
    viewpoint: chapter.viewpoint ?? [],
    goal_cn: chapter.goal_cn,
    passage_count: chapter.passage_count ?? passages.length,
    global_arc: chapter.global_arc ?? {},
    passage_ids: passages.map((passage) => passage.id),
    passages: passages.map((passage) => buildPassagePreview(passage)),
  };

  const targetPath = path.join(BOOKS_DIR, book.id, "chapters", chapterSlug, "manifest.json");
  await ensureDir(path.dirname(targetPath));
  await fs.writeFile(targetPath, `${JSON.stringify(chapterManifest, null, 2)}\n`);

  return {
    chapter: {
      id: chapterManifest.id,
      book_id: chapterManifest.book_id,
      source_title: chapterManifest.source_title,
      adapted_title_cn: chapterManifest.adapted_title_cn,
      viewpoint: chapterManifest.viewpoint,
      goal_cn: chapterManifest.goal_cn,
      passage_count: chapterManifest.passage_count,
      global_arc: chapterManifest.global_arc,
      passage_ids: chapterManifest.passage_ids,
    },
    passages,
  };
}

async function main() {
  await ensureDir(BOOKS_DIR);

  const books = await loadBooksConfig();
  const bookExports = await Promise.all(
    books.map(async (book) => {
      const chapterExports = await Promise.all(
        (book.chapter_ids ?? []).map((chapterId) => exportChapter(path.join(STORY_DIR, `${chapterId}.json`), book))
      );

      const chapters = chapterExports.map((item) => item.chapter);
      const passages = chapterExports.flatMap((item) => item.passages);
      const bookManifest = {
        id: book.id,
        title: book.title,
        subtitle: book.subtitle,
        description: book.description,
        total_chapter_count: book.total_chapter_count ?? null,
        available_chapter_count: chapters.length,
        chapter_ids: chapters.map((chapter) => chapter.id),
        chapter_count: chapters.length,
        chapters,
      };

      const targetPath = path.join(BOOKS_DIR, book.id, "manifest.json");
      await ensureDir(path.dirname(targetPath));
      await fs.writeFile(targetPath, `${JSON.stringify(bookManifest, null, 2)}\n`);

      return {
        book: {
          id: bookManifest.id,
          title: bookManifest.title,
          subtitle: bookManifest.subtitle,
          description: bookManifest.description,
          total_chapter_count: bookManifest.total_chapter_count,
          available_chapter_count: bookManifest.available_chapter_count,
          chapter_ids: bookManifest.chapter_ids,
          chapter_count: bookManifest.chapter_count,
        },
        chapters,
        passages,
      };
    })
  );

  const allChapters = bookExports.flatMap((item) => item.chapters);
  const allPassages = bookExports.flatMap((item) => item.passages);

  const manifest = {
    version: "v0.3.3",
    generated_at: new Date().toISOString(),
    project: {
      title: "三国演义",
      subtitle: "让三国故事更好读，更有画面",
      description:
        "当前中文重写稿的阅读空间，按作品、章节、段落逐步进入故事。",
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
        approved_en: allPassages.filter((passage) => passage.available_locales.includes("en")).length,
      },
    },
    books: bookExports.map((item) => item.book),
    memory: {
      story_index: await readJson(path.join(MEMORY_DIR, "story_index.json")),
      working_memory: await readJson(path.join(MEMORY_DIR, "working_memory.json")),
    },
  };

  await fs.writeFile(path.join(CONTENT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  const warnings = validateLocaleIntegrity(allPassages);
  if (warnings.length) {
    console.warn("Locale validation warnings:");
    for (const warning of warnings) {
      console.warn(`  - ${warning}`);
    }
  }
  console.log(`Exported ${allPassages.length} passages (${manifest.project.stats.approved_en} with English).`);
}

function validateLocaleIntegrity(passages) {
  const warnings = [];

  for (const passage of passages) {
    const locales = passage.available_locales ?? [];

    if (!locales.includes("zh")) {
      warnings.push(`${passage.id}: available_locales is missing "zh" — every passage must have Chinese`);
    }

    if (locales.includes("en") && !passage.localized?.en?.reading?.text) {
      warnings.push(`${passage.id}: available_locales includes "en" but localized.en has no reading text`);
    }

    if (passage.localized?.en?.reading?.text && !locales.includes("en")) {
      warnings.push(`${passage.id}: localized.en has content but "en" is not in available_locales`);
    }
  }

  return warnings;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
