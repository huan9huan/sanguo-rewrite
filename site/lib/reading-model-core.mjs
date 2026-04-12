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

export function buildPassageReadingModel(args) {
  const source = args.sourceLabel || (args.approvedText ? "approved_cn" : args.draftText ? "draft_cn" : "none");
  const text = args.approvedText || args.draftText;
  const segments = applyComicAlignment(
    buildReadingSegments(args.passageId, args.scenes, text, args.comicLayout),
    args.comicAlignment,
    args.comicLayout
  );

  return {
    source,
    text,
    comic: {
      image: args.image,
      layout: args.comicLayout,
      alignment: args.comicAlignment,
    },
    segments,
  };
}
