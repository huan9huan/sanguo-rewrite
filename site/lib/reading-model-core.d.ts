declare module "@/lib/reading-model-core.mjs" {
  import type {
    ComicLayout,
    ComicPassageAlignment,
    PassageImage,
    PassageReadingModel,
    Scene,
  } from "@/lib/types";

  export function buildPassageReadingModel(args: {
    draftText: string;
    approvedText: string;
    image: PassageImage | null;
    comicLayout: ComicLayout | null;
    comicAlignment: ComicPassageAlignment | null;
    passageId: string;
    scenes: Scene[];
  }): PassageReadingModel;
}
