import type { MetadataRoute } from "next";
import { getAllBooks, getAllPassages, getBookById, getChapterById } from "@/lib/content";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

const LOCALES = ["zh", "en"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL },
    { url: absoluteUrl("/zh") },
    { url: absoluteUrl("/en") },
    { url: absoluteUrl("/zh/about") },
    { url: absoluteUrl("/en/about") },
    { url: absoluteUrl("/zh/read") },
    { url: absoluteUrl("/en/read") },
  ];

  const books = await getAllBooks();

  for (const book of books) {
    entries.push({ url: absoluteUrl(`/zh/read/${book.id}`) });
    if (book.title_en || book.description_en) {
      entries.push({ url: absoluteUrl(`/en/read/${book.id}`) });
    }

    const fullBook = await getBookById(book.id);
    if (!fullBook) continue;

    for (const chapter of fullBook.chapters) {
      entries.push({ url: absoluteUrl(`/zh/read/${book.id}/${chapter.id}`) });

      const fullChapter = await getChapterById(book.id, chapter.id);
      const hasEn = fullChapter?.passages.some((passage) => passage.available_locales?.includes("en"));
      if (hasEn) {
        entries.push({ url: absoluteUrl(`/en/read/${book.id}/${chapter.id}`) });
      }
    }
  }

  const passages = await getAllPassages();
  for (const passage of passages) {
    entries.push({
      url: absoluteUrl(`/zh/read/${passage.book_id}/${passage.chapter_id}/${passage.passage_id}`),
    });
    if (passage.available_locales.includes("en")) {
      entries.push({
        url: absoluteUrl(`/en/read/${passage.book_id}/${passage.chapter_id}/${passage.passage_id}`),
      });
    }
  }

  return Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());
}
