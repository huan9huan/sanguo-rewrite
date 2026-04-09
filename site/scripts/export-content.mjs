import { promises as fs } from "fs";
import path from "path";

const SITE_ROOT = process.cwd();
const REPO_ROOT = path.resolve(SITE_ROOT, "..");
const STORY_DIR = path.join(REPO_ROOT, "story");
const MEMORY_DIR = path.join(REPO_ROOT, "memory");
const CONTENT_DIR = path.join(SITE_ROOT, "public", "content");
const PASSAGES_DIR = path.join(CONTENT_DIR, "passages");
const ASSETS_DIR = path.join(CONTENT_DIR, "assets", "passages");

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

function cleanReadingText(text) {
  return String(text ?? "")
    .replace(/^# .+\n+/m, "")
    .replace(/\n?---\n?/g, "\n\n---\n\n")
    .trim();
}

function splitReadingParagraphs(text) {
  return cleanReadingText(text)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => Boolean(block) && block !== "---");
}

function extractKeywords(text) {
  const matches = String(text ?? "").match(/[\u4e00-\u9fff]{2,}|[A-Za-z0-9]{2,}/g) ?? [];
  const stopwords = new Set([
    "这个",
    "一个",
    "什么",
    "他们",
    "你们",
    "我们",
    "自己",
    "没有",
    "不是",
    "可以",
    "然后",
    "因为",
    "于是",
    "有人",
    "出来",
    "进去",
    "事情",
    "时候",
    "一天",
    "两个",
    "三个",
    "起来",
    "就是",
  ]);

  return Array.from(new Set(matches.map((item) => item.trim()).filter((item) => item.length >= 2 && !stopwords.has(item))));
}

function sceneProfileText(scene, frames) {
  const frameText = frames.flatMap((frame) => [frame.title, ...frame.items.map((item) => item.text)]).join(" ");
  return [
    scene?.goal ?? "",
    scene?.purpose ?? "",
    scene?.setting ?? "",
    ...(scene?.characters ?? []),
    ...(scene?.must_include ?? []),
    frameText,
  ].join(" ");
}

function countKeywordHits(text, keywords) {
  return keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? Math.min(keyword.length, 6) : 0), 0);
}

function toHanBigrams(text) {
  const normalized = String(text ?? "").replace(/[^\u4e00-\u9fff]/g, "");
  const result = [];
  for (let index = 0; index < normalized.length - 1; index += 1) {
    result.push(normalized.slice(index, index + 2));
  }
  return result;
}

function bigramOverlapScore(a, b) {
  const aBigrams = new Set(toHanBigrams(a));
  const bBigrams = new Set(toHanBigrams(b));
  let overlap = 0;
  aBigrams.forEach((item) => {
    if (bBigrams.has(item)) overlap += 1;
  });
  return overlap;
}

function buildSceneIntervals(paragraphs, scenes, comicLayout) {
  const sceneCount = scenes.length || 1;
  const framesByScene = Array.from({ length: sceneCount }, (_, index) => {
    const sceneId = scenes[index]?.id ?? "";
    return (comicLayout?.frames ?? []).filter((frame) => frame.scene_id === sceneId);
  });
  const profileTexts = Array.from({ length: sceneCount }, (_, index) => sceneProfileText(scenes[index], framesByScene[index]));
  const profiles = profileTexts.map((text) => extractKeywords(text));

  const paragraphScores = paragraphs.map((paragraph, paragraphIndex) =>
    profiles.map((keywords, sceneIndex) => {
      const coverage = countKeywordHits(paragraph, keywords);
      const similarity = bigramOverlapScore(paragraph, profileTexts[sceneIndex]) * 0.6;
      const positionTarget = sceneCount === 1 ? 0.5 : sceneIndex / (sceneCount - 1);
      const positionHere = paragraphs.length === 1 ? 0.5 : paragraphIndex / (paragraphs.length - 1);
      const positionBias = 3 - Math.abs(positionHere - positionTarget) * 4;
      return coverage + similarity + positionBias;
    })
  );

  const prefix = Array.from({ length: sceneCount }, () => new Array(paragraphs.length + 1).fill(0));
  for (let sceneIndex = 0; sceneIndex < sceneCount; sceneIndex += 1) {
    for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex += 1) {
      prefix[sceneIndex][paragraphIndex + 1] = prefix[sceneIndex][paragraphIndex] + paragraphScores[paragraphIndex][sceneIndex];
    }
  }

  const dp = Array.from({ length: sceneCount + 1 }, () => new Array(paragraphs.length + 1).fill(Number.NEGATIVE_INFINITY));
  const backtrack = Array.from({ length: sceneCount + 1 }, () => new Array(paragraphs.length + 1).fill(0));
  dp[0][0] = 0;

  for (let sceneIndex = 1; sceneIndex <= sceneCount; sceneIndex += 1) {
    for (let end = sceneIndex; end <= paragraphs.length; end += 1) {
      for (let start = sceneIndex - 1; start < end; start += 1) {
        const previous = dp[sceneIndex - 1][start];
        if (!Number.isFinite(previous)) continue;
        const intervalScore = prefix[sceneIndex - 1][end] - prefix[sceneIndex - 1][start];
        const score = previous + intervalScore;
        if (score > dp[sceneIndex][end]) {
          dp[sceneIndex][end] = score;
          backtrack[sceneIndex][end] = start;
        }
      }
    }
  }

  const intervals = new Array(sceneCount);
  let cursor = paragraphs.length;
  for (let sceneIndex = sceneCount; sceneIndex >= 1; sceneIndex -= 1) {
    const start = backtrack[sceneIndex][cursor];
    intervals[sceneIndex - 1] = { start, end: cursor };
    cursor = start;
  }

  return { intervals, framesByScene };
}

function buildComicPlacements(paragraphs, frames) {
  if (!paragraphs.length || !frames.length) {
    return [];
  }

  const paragraphKeywords = paragraphs.map((paragraph) => extractKeywords(paragraph));
  const placements = new Map();
  let minIndex = 0;

  frames.forEach((frame, frameIndex) => {
    const frameText = [frame.title, ...frame.items.map((item) => item.text)].join(" ");
    const frameKeywords = extractKeywords(frameText);
    let bestIndex = minIndex;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let index = minIndex; index < paragraphs.length; index += 1) {
      const overlap = paragraphKeywords[index].reduce(
        (sum, keyword) => sum + (frameKeywords.includes(keyword) ? Math.min(keyword.length, 6) : 0),
        0
      );
      const similarity = bigramOverlapScore(paragraphs[index], frameText) * 0.8;
      const orderBias = -(index - frameIndex * (paragraphs.length / Math.max(frames.length, 1))) * 0.15;
      const score = overlap + similarity + orderBias;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }

    const group = placements.get(bestIndex) ?? [];
    group.push(frame);
    placements.set(bestIndex, group);
    minIndex = bestIndex;
  });

  return Array.from(placements.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([after_paragraph, groupedFrames]) => ({ after_paragraph, frames: groupedFrames }));
}

function buildReadingSegments(passageId, scenes, readingText, comicLayout) {
  const paragraphs = splitReadingParagraphs(readingText);
  const sceneCount = scenes.length || 1;
  const safeParagraphs = paragraphs.length ? paragraphs : [cleanReadingText(readingText)];
  const { intervals, framesByScene } = buildSceneIntervals(safeParagraphs, scenes, comicLayout);

  return Array.from({ length: sceneCount }, (_, index) => {
    const scene = scenes[index];
    const sceneId = scene?.id ?? `${passageId}-scene-${index + 1}`;
    const interval = intervals[index] ?? { start: index, end: index + 1 };
    const sceneParagraphs = safeParagraphs.slice(interval.start, interval.end).filter(Boolean);
    const comicFrames = framesByScene[index] ?? [];

    return {
      id: `${passageId}-segment-${index + 1}`,
      scene_id: sceneId,
      scene_title: scene?.goal || scene?.purpose || `Scene ${index + 1}`,
      scene_type: scene?.type || "",
      text: sceneParagraphs.join("\n\n"),
      paragraph_offset: interval.start,
      paragraphs: sceneParagraphs,
      comic_placements: buildComicPlacements(sceneParagraphs, comicFrames),
      comic_frames: comicFrames,
    };
  }).filter((segment) => segment.text || segment.comic_frames.length);
}

function applyComicAlignment(segments, alignment, comicLayout) {
  if (!alignment || !comicLayout) {
    return segments;
  }

  const frameById = new Map(comicLayout.frames.map((frame) => [frame.frame_id, frame]));

  return segments.map((segment) => {
    const placements = alignment.placements
      .filter((placement) => placement.scene_id === segment.scene_id)
      .map((placement) => ({
        after_paragraph: Math.max(
          0,
          Math.min(
            placement.after_paragraph_index - segment.paragraph_offset,
            Math.max(segment.paragraphs.length - 1, 0)
          )
        ),
        frames: [frameById.get(placement.frame_id)].filter(Boolean),
      }))
      .filter((placement) => placement.frames.length);

    if (!placements.length) {
      return segment;
    }

    const grouped = new Map();
    placements.forEach((placement) => {
      const current = grouped.get(placement.after_paragraph) ?? [];
      grouped.set(placement.after_paragraph, [...current, ...placement.frames]);
    });

    return {
      ...segment,
      comic_placements: Array.from(grouped.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([after_paragraph, frames]) => ({ after_paragraph, frames })),
    };
  });
}

async function exportPassage(passageDir) {
  const passageText = await fs.readFile(path.join(passageDir, "passage.md"), "utf8");
  const passageMd = parseFrontmatterMarkdown(passageText);
  const frontmatter = passageMd.frontmatter;
  const spec = await readJson(path.join(passageDir, "spec.json"));
  const currentDir = path.join(passageDir, "current");

  const latestDraftPath = await firstExistingPath([
    path.join(currentDir, "draft_cn.md"),
    await latestVersionFile(passageDir, /^draft_cn_v\d+\.md$/),
  ]);
  const latestReviewPath = await firstExistingPath([
    path.join(currentDir, "draft_cn_review.json"),
    await latestVersionFile(passageDir, /^draft_cn_v\d+_review\.json$/),
  ]);
  const latestApprovedPath = await firstExistingPath([
    path.join(currentDir, "approved_cn.md"),
    await latestVersionFile(passageDir, /^cp.*_cn_v\d+\.md$/),
  ]);
  const imagePath = await firstExistingPath([
    path.join(currentDir, "image.png"),
    path.join(currentDir, "image.jpg"),
    path.join(currentDir, "image.jpeg"),
    path.join(currentDir, "image.webp"),
    await latestVersionFile(passageDir, /^image\.(png|jpg|jpeg|webp)$/i),
  ]);
  const comicLayoutPath = await firstExistingPath([
    path.join(currentDir, "comic_reader_layout.json"),
    await latestVersionFile(passageDir, /^comic_reader_layout_v\d+\.json$/),
  ]);
  const comicAlignmentPath = await firstExistingPath([
    path.join(currentDir, "comic_passage_alignment.json"),
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
  const draftText = latestDraftPath ? await readText(latestDraftPath) : "";
  const approvedText = latestApprovedPath ? await readText(latestApprovedPath) : "";
  const readingText = approvedText || draftText;
  const scenes = await loadSceneSpecs(passageDir);
  const comicLayout = await loadComicLayout(comicLayoutPath);
  const comicAlignment = await loadComicAlignment(comicAlignmentPath);

  let exportedImage = null;
  if (imagePath) {
    const extension = path.extname(imagePath).toLowerCase();
    const targetRelativePath = `assets/passages/${passageId}${extension}`;
    const targetAbsolutePath = path.join(CONTENT_DIR, targetRelativePath);
    await ensureDir(path.dirname(targetAbsolutePath));
    await fs.copyFile(imagePath, targetAbsolutePath);
    const imageMetadata = await readImageMetadata(imagePath);
    exportedImage = {
      path: targetRelativePath,
      url: `/${targetRelativePath}`,
      alt: `${title} image`,
      width: imageMetadata.width,
      height: imageMetadata.height,
    };
  }

  const payload = {
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
      text: draftText,
    },
    approved_cn: {
      path: latestApprovedPath ? path.relative(passageDir, latestApprovedPath) : null,
      text: approvedText,
    },
    image: exportedImage,
    comic_layout: comicLayout,
    comic_alignment: comicAlignment,
    reading_text: readingText,
    reading_segments: applyComicAlignment(
      buildReadingSegments(passageId, scenes, readingText, comicLayout),
      comicAlignment,
      comicLayout
    ),
    review: await loadReview(latestReviewPath),
    scenes,
    source: {
      path: sourcePath ? path.relative(REPO_ROOT, sourcePath) : null,
      text: sourceText,
    },
  };

  const targetPath = path.join(PASSAGES_DIR, `${passageId}.json`);
  await fs.writeFile(targetPath, `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

async function exportChapter(chapterPath) {
  const chapter = await readJson(chapterPath);
  const chapterSlug = path.basename(chapterPath, ".json");
  const storyEntries = await fs.readdir(STORY_DIR, { withFileTypes: true });
  const passageDirs = storyEntries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(`${chapterSlug}-p`))
    .map((entry) => path.join(STORY_DIR, entry.name))
    .sort();

  const passages = await Promise.all(passageDirs.map((dir) => exportPassage(dir)));

  return {
    chapter: {
      id: chapterSlug,
      source_title: chapter.source_title,
      adapted_title_cn: chapter.adapted_title_cn,
      viewpoint: chapter.viewpoint ?? [],
      goal_cn: chapter.goal_cn,
      passage_count: chapter.passage_count ?? passages.length,
      global_arc: chapter.global_arc ?? {},
      passage_ids: passages.map((passage) => passage.id),
    },
    passages,
  };
}

async function main() {
  await ensureDir(PASSAGES_DIR);
  await ensureDir(ASSETS_DIR);

  const storyEntries = await fs.readdir(STORY_DIR);
  const chapterFiles = storyEntries
    .filter((file) => /^cp\d+\.json$/.test(file))
    .sort()
    .map((file) => path.join(STORY_DIR, file));

  const chapterExports = await Promise.all(chapterFiles.map((file) => exportChapter(file)));
  const chapters = chapterExports.map((item) => item.chapter);
  const allPassages = chapterExports.flatMap((item) => item.passages);

  const manifest = {
    version: "v0.2.3",
    generated_at: new Date().toISOString(),
    project: {
      title: "三国演义",
      subtitle: "A story-first rewrite of Romance of the Three Kingdoms",
      description:
        "A reading room for the current draft, designed for readers who want to enter the story passage by passage.",
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
      story_index: await readJson(path.join(MEMORY_DIR, "story_index.json")),
      working_memory: await readJson(path.join(MEMORY_DIR, "working_memory.json")),
    },
  };

  await fs.writeFile(path.join(CONTENT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
