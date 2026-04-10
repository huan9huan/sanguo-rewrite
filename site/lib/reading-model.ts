import { buildPassageReadingModel as buildPassageReadingModelCore } from "@/lib/reading-model-core.mjs";
import type { PassageImage, PassageReadingModel, Scene, ComicLayout, ComicPassageAlignment } from "@/lib/types";

export function buildPassageReadingModel(args: {
  draftText: string;
  approvedText: string;
  image: PassageImage | null;
  comicLayout: ComicLayout | null;
  comicAlignment: ComicPassageAlignment | null;
  passageId: string;
  scenes: Scene[];
}): PassageReadingModel {
  return buildPassageReadingModelCore(args) as PassageReadingModel;
}
