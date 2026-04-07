import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";

const REPO_ROOT = path.resolve(process.cwd(), "..");
const STORY_DIR = path.join(REPO_ROOT, "story");
const MEMORY_DIR = path.join(REPO_ROOT, "memory");

async function readText(filePath) {
  return (await fs.readFile(filePath, "utf8")).trim();
}

async function readJson(filePath) {
  return JSON.parse(await readText(filePath));
}

function parseFrontmatterMarkdown(text) {
  const result = { frontmatter: {}, body: text.trim() };
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
        if (!Array.isArray(frontmatter[currentKey])) {
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

  return { frontmatter, body: body.trim() };
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
  return body.slice(start, end).trim();
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

async function loadSceneSpecs(passageDir) {
  const files = (await fs.readdir(passageDir))
    .filter((file) => /^s\d+-spec\.json$/.test(file))
    .sort();

  const scenes = await Promise.all(
    files.map(async (file) => {
      const scene = await readJson(path.join(passageDir, file));
      return {
        id: scene.scene_id,
        type: scene.scene_type,
        purpose: scene.purpose_cn,
        goal: scene.scene_goal_cn,
        setting: scene.setting_cn,
        characters: scene.characters || [],
        must_include: scene.must_include || [],
        must_avoid: scene.must_avoid || [],
      };
    })
  );

  return scenes;
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
    strengths: review.strengths || [],
    issues: review.issues || [],
    scene_coverage: review.scene_coverage || {},
    spec_compliance: review.spec_compliance || {},
  };
}

async function loadPassage(passageDir) {
  const passageText = await fs.readFile(path.join(passageDir, "passage.md"), "utf8");
  const passageMd = parseFrontmatterMarkdown(passageText);
  const frontmatter = passageMd.frontmatter;
  const spec = await readJson(path.join(passageDir, "spec.json"));
  const latestDraftPath = await latestVersionFile(passageDir, /^draft_cn_v\d+\.md$/);
  const latestReviewPath = await latestVersionFile(passageDir, /^draft_cn_v\d+_review\.json$/);
  const latestApprovedPath = await latestVersionFile(passageDir, /^cp.*_cn_v\d+\.md$/);
  const sourceRef = frontmatter.source_file;
  const sourcePath = sourceRef ? path.resolve(passageDir, sourceRef) : null;

  let sourceText = "";
  if (sourcePath) {
    const sourceMd = parseFrontmatterMarkdown(await fs.readFile(sourcePath, "utf8"));
    sourceText = extractSection(sourceMd.body, "Source") || sourceMd.body;
  }

  return {
    id: frontmatter.id || path.basename(passageDir),
    chapter_id: frontmatter.chapter_id || "",
    passage_id: frontmatter.passage_id || "",
    title: frontmatter.title || spec.title_cn || path.basename(passageDir),
    status: frontmatter.status || spec.status || "draft",
    summary_markdown: extractSection(passageMd.body, "Summary"),
    scene_plan_markdown: extractSection(passageMd.body, "Scene Plan"),
    source_note_markdown: extractSection(passageMd.body, "Source"),
    spec: {
      title_cn: spec.title_cn,
      goal_cn: spec.goal_cn,
      dramatic_question_cn: spec.dramatic_question_cn,
      emotion_curve: spec.emotion_curve || [],
      hook_cn: spec.hook_cn,
      conflict_cn: spec.conflict_cn,
      turn_cn: spec.turn_cn,
      ending_hook_cn: spec.ending_hook_cn,
      source_text_range: spec.source_text_range,
      must_include: spec.must_include || [],
      must_avoid: spec.must_avoid || [],
      viewpoint_focus: spec.viewpoint_focus || [],
    },
    draft: {
      path: latestDraftPath ? path.basename(latestDraftPath) : null,
      text: latestDraftPath ? await readText(latestDraftPath) : "",
    },
    approved_cn: {
      path: latestApprovedPath ? path.basename(latestApprovedPath) : null,
      text: latestApprovedPath ? await readText(latestApprovedPath) : "",
    },
    review: await loadReview(latestReviewPath),
    scenes: await loadSceneSpecs(passageDir),
    source: {
      path: sourcePath ? path.relative(REPO_ROOT, sourcePath) : null,
      text: sourceText,
    },
  };
}

async function loadChapter(chapterPath) {
  const chapter = await readJson(chapterPath);
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
    viewpoint: chapter.viewpoint || [],
    goal_cn: chapter.goal_cn,
    passage_count: chapter.passage_count || passages.length,
    global_arc: chapter.global_arc || {},
    passages,
  };
}

export const getSiteData = cache(async function getSiteData() {
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
      story_index: await readJson(path.join(MEMORY_DIR, "story_index.json")),
      working_memory: await readJson(path.join(MEMORY_DIR, "working_memory.json")),
    },
  };
});
