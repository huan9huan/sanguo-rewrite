import zh from "./locales/zh.json";
import en from "./locales/en.json";
import type { Locale } from "@/lib/types";

export type Dictionary = typeof zh;

const dictionaries: Record<Locale, Dictionary> = { zh, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.zh;
}
