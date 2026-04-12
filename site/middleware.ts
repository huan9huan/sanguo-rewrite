import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_LOCALES = ["zh", "en"];
const ZH_REGIONS = ["zh-cn", "zh-tw", "zh-hk", "zh-mo", "zh-sg"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, API routes, and internal Next.js paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/content") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Already on a locale path — do nothing
  if (SUPPORTED_LOCALES.some((loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`))) {
    return NextResponse.next();
  }

  // Check for saved preference in cookie
  const cookieLocale = request.cookies.get("locale")?.value;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    return NextResponse.redirect(new URL(`/${cookieLocale}${pathname}`, request.url));
  }

  // Detect from Accept-Language: Greater China → zh, everything else → en
  const acceptLanguage = request.headers.get("accept-language") || "";
  const languages = acceptLanguage
    .split(",")
    .map((part) => part.trim().split(";")[0].trim().toLowerCase());

  const isZh = languages.some((lang) => ZH_REGIONS.some((zr) => lang === zr || lang === "zh"));
  const targetLocale = isZh ? "zh" : "en";

  return NextResponse.redirect(new URL(`/${targetLocale}${pathname}`, request.url));
}

export const config = {
  matcher: ["/((?!_next|api|content|favicon.ico|.*\\..*).*)"],
};
