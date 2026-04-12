import type { Locale } from "./types";

type ChapterTitleInput = {
  id: string;
  source_title: string;
  display_title_en?: string;
};

function toChineseNumber(value: number): string {
  const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

  if (value <= 10) {
    if (value === 10) return "十";
    return digits[value] ?? String(value);
  }

  if (value < 20) {
    return `十${digits[value % 10]}`;
  }

  if (value < 100) {
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return `${digits[tens]}十${ones ? digits[ones] : ""}`;
  }

  if (value < 1000) {
    const hundreds = Math.floor(value / 100);
    const remainder = value % 100;
    if (!remainder) {
      return `${digits[hundreds]}百`;
    }
    if (remainder < 10) {
      return `${digits[hundreds]}百零${digits[remainder]}`;
    }
    return `${digits[hundreds]}百${toChineseNumber(remainder)}`;
  }

  return String(value);
}

export function formatChapterTitle(chapter: ChapterTitleInput, locale: Locale = "zh"): string {
  const numeric = Number(chapter.id.replace(/\D/g, ""));
  if (!numeric) {
    return chapter.source_title;
  }

  if (locale === "en" && chapter.display_title_en) {
    return `Chapter ${numeric}: ${chapter.display_title_en}`;
  }

  return `第${toChineseNumber(numeric)}回 ${chapter.source_title}`;
}
