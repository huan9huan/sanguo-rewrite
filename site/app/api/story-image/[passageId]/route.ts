import { promises as fs } from "fs";
import path from "path";

const REPO_ROOT = path.resolve(process.cwd(), "..");
const STORY_DIR = path.join(REPO_ROOT, "story");
const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

type RouteContext = {
  params: Promise<{
    passageId: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  const { passageId } = await params;
  const safePassageId = path.basename(passageId);
  const passageDir = path.join(STORY_DIR, safePassageId);

  try {
    const files = await fs.readdir(passageDir);
    const imageFile = files.find((file) => /^image\.(png|jpg|jpeg|webp)$/i.test(file));

    if (!imageFile) {
      return new Response("Image not found", { status: 404 });
    }

    const imagePath = path.join(passageDir, imageFile);
    const extension = path.extname(imageFile).toLowerCase();
    const contentType = CONTENT_TYPES[extension] || "application/octet-stream";
    const imageBuffer = await fs.readFile(imagePath);

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Image not found", { status: 404 });
  }
}
