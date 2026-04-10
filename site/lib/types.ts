export type Scene = {
  id: string;
  type: string;
  purpose: string;
  goal: string;
  setting: string;
  characters: string[];
  must_include: string[];
  must_avoid: string[];
};

export type ReviewIssue = {
  severity: string;
  dimension: string;
  location: string;
  problem: string;
  suggestion: string;
};

export type Review = {
  version: number;
  verdict: string;
  summary: string;
  strengths: string[];
  issues: ReviewIssue[];
  scene_coverage: Record<string, unknown>;
  spec_compliance: Record<string, unknown>;
};

export type PassageSpec = {
  title_cn: string;
  goal_cn: string;
  dramatic_question_cn: string;
  emotion_curve: string[];
  hook_cn: string;
  conflict_cn: string;
  turn_cn: string;
  ending_hook_cn: string;
  source_text_range: string;
  must_include: string[];
  must_avoid: string[];
  viewpoint_focus: string[];
};

export type PassageImage = {
  path: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
};

export type ComicFrameTextItem = {
  id: string;
  kind: string;
  speaker: string;
  text: string;
  lang: string;
};

export type ComicFrame = {
  frame_id: string;
  scene_id: string;
  title: string;
  items: ComicFrameTextItem[];
  panel_box?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
};

export type ComicLayout = {
  page_id: string;
  version: number;
  viewport_mode: string;
  frame_aspect_ratio: string;
  frames: ComicFrame[];
};

export type ReadingSegment = {
  id: string;
  scene_id: string;
  scene_title: string;
  scene_type: string;
  text: string;
  paragraph_offset: number;
  paragraphs: string[];
  comic_placements: Array<{
    after_paragraph: number;
    frames: ComicFrame[];
  }>;
  comic_frames: ComicFrame[];
};

export type ComicPassageAlignment = {
  passage_id: string;
  based_on_text: string;
  based_on_comic_layout: string;
  version_note: string;
  policy: {
    goal: string;
    unit: string;
    rule: string;
  };
  placements: Array<{
    frame_id: string;
    scene_id: string;
    after_paragraph_index: number;
    anchor_quote: string;
    confidence: number;
    reason: string;
  }>;
  notes: string[];
};

export type PassageRouteParams = {
  bookId: string;
  chapterId: string;
  passageId: string;
};

export type Passage = {
  id: string;
  book_id: string;
  chapter_id: string;
  passage_id: string;
  title: string;
  status: string;
  summary_markdown: string;
  scene_plan_markdown: string;
  source_note_markdown: string;
  spec: PassageSpec;
  draft: {
    path: string | null;
    text: string;
  };
  approved_cn: {
    path: string | null;
    text: string;
  };
  image: PassageImage | null;
  comic_layout: ComicLayout | null;
  comic_alignment: ComicPassageAlignment | null;
  reading_text: string;
  reading_segments: ReadingSegment[];
  review: Review | null;
  scenes: Scene[];
  source: {
    path: string | null;
    text: string;
  };
};

export type PassagePreview = {
  id: string;
  book_id: string;
  chapter_id: string;
  passage_id: string;
  title: string;
  status: string;
  summary_markdown: string;
  teaser: string;
  has_comic: boolean;
  image: PassageImage | null;
};

export type ChapterSummary = {
  id: string;
  book_id: string;
  source_title: string;
  adapted_title_cn: string;
  viewpoint: string[];
  goal_cn: string;
  passage_count: number;
  global_arc: Record<string, unknown>;
  passage_ids: string[];
};

export type Chapter = ChapterSummary & {
  passages: Passage[];
};

export type ChapterManifest = ChapterSummary & {
  passages: PassagePreview[];
};

export type BookMeta = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  total_chapter_count: number | null;
  available_chapter_count: number;
  chapter_ids: string[];
  chapter_count: number;
};

export type BookManifest = BookMeta & {
  chapters: ChapterSummary[];
};

export type Book = Omit<BookManifest, "chapters"> & {
  chapters: Chapter[];
};

export type WorkingMemory = {
  current_task: string;
  current_focus_cn: string;
  carry_forward: string[];
};

export type StoryThread = {
  summary_cn: string;
};

export type StoryIndex = {
  threads?: Record<string, StoryThread>;
};

export type SiteData = {
  project: {
    title: string;
    subtitle: string;
    description: string;
    principles: string[];
    pipeline: string[];
    stats: {
      chapters: number;
      passages: number;
      reviews: number;
      approved_cn: number;
    };
  };
  books: Book[];
  memory: {
    story_index: StoryIndex;
    working_memory: WorkingMemory;
  };
};
