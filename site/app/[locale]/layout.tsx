import type { ReactNode } from "react";
import type { Locale } from "@/lib/types";

const VALID_LOCALES: Locale[] = ["zh", "en"];
const LOCALE_LANG_MAP: Record<Locale, string> = { zh: "zh-CN", en: "en" };

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  const safeLocale = VALID_LOCALES.includes(locale as Locale) ? (locale as Locale) : "zh";

  return (
    <div lang={LOCALE_LANG_MAP[safeLocale]}>
      {children}
    </div>
  );
}
