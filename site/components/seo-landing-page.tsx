import Link from "next/link";
import { LandingCtaLink } from "@/components/landing-cta-link";
import { SiteFooter } from "@/components/site-footer";
import { SiteMark } from "@/components/site-mark";
import { getDictionary } from "@/i18n";
import { getBookById, getChapterById, getPassageBySlugs } from "@/lib/content";
import { resolveLocalizedPassage } from "@/lib/locale";
import { buildBookHref, buildComicHref, buildLibraryHref, buildPassageHref } from "@/lib/paths";
import type { Locale, PassagePreview } from "@/lib/types";

type SeoLandingPageProps = {
  locale: Locale;
};

const FEATURED_BOOK_ID = "sanguo";
const FEATURED_CHAPTER_ID = "cp001";
const FEATURED_PASSAGE_ID = "p01";
const VISUAL_PASSAGE_ID = "p03";

function getLocalizedBookTitle(book: NonNullable<Awaited<ReturnType<typeof getBookById>>>, locale: Locale) {
  return locale === "en" && book.title_en ? book.title_en : book.title;
}

function getLocalizedBookSubtitle(book: NonNullable<Awaited<ReturnType<typeof getBookById>>>, locale: Locale) {
  return locale === "en" && book.subtitle_en ? book.subtitle_en : book.subtitle;
}

function getLocalizedPassageTitle(passage: PassagePreview, locale: Locale) {
  return locale === "en" && passage.title_en ? passage.title_en : passage.title;
}

function getLocalizedPassageCatchup(passage: PassagePreview, locale: Locale) {
  return locale === "en" && passage.catchup_en ? passage.catchup_en : passage.catchup;
}

export async function SeoLandingPage({ locale }: SeoLandingPageProps) {
  const t = getDictionary(locale);
  const isEn = locale === "en";
  const [book, chapter, startPassage, visualPassage] = await Promise.all([
    getBookById(FEATURED_BOOK_ID),
    getChapterById(FEATURED_BOOK_ID, FEATURED_CHAPTER_ID),
    getPassageBySlugs(FEATURED_BOOK_ID, FEATURED_CHAPTER_ID, FEATURED_PASSAGE_ID),
    getPassageBySlugs(FEATURED_BOOK_ID, FEATURED_CHAPTER_ID, VISUAL_PASSAGE_ID),
  ]);

  const firstReadablePassage =
    chapter?.passages.find((passage) => passage.passage_id === FEATURED_PASSAGE_ID && (!isEn || passage.available_locales?.includes("en"))) ??
    chapter?.passages.find((passage) => !isEn || passage.available_locales?.includes("en")) ??
    null;

  const bookTitle = book ? getLocalizedBookTitle(book, locale) : t.landing.featuredBookFallback;
  const bookSubtitle = book ? getLocalizedBookSubtitle(book, locale) : "";
  const chapterTitle = chapter ? (isEn && chapter.display_title_en ? chapter.display_title_en : chapter.adapted_title_cn || chapter.source_title) : "";
  const localizedStartPassage = startPassage ? resolveLocalizedPassage(startPassage, locale) : null;
  const passageTitle = localizedStartPassage?.title ?? (firstReadablePassage ? getLocalizedPassageTitle(firstReadablePassage, locale) : "");
  const passageCatchup = t.landing.currentPassageSummary || localizedStartPassage?.catchup || (firstReadablePassage ? getLocalizedPassageCatchup(firstReadablePassage, locale) : "");
  const readingHref = firstReadablePassage
    ? buildPassageHref({
        bookId: FEATURED_BOOK_ID,
        chapterId: FEATURED_CHAPTER_ID,
        passageId: firstReadablePassage.passage_id,
      }, locale)
    : buildLibraryHref(locale);
  const comicHref = firstReadablePassage
    ? buildComicHref({
        bookId: FEATURED_BOOK_ID,
        chapterId: FEATURED_CHAPTER_ID,
        passageId: firstReadablePassage.passage_id,
      }, locale)
    : buildLibraryHref(locale);
  const visualImage = visualPassage?.reading.comic.image;

  return (
    <div className="page-shell home-hero-page">
      <main>
        <section className="home-hero">
          <div className="container home-hero-inner">
            <div className="home-hero-copy">
              <SiteMark className="home-site-mark" label="Read Chinese Classics" />
              <p className="home-hero-kicker">{t.landing.heroKicker}</p>
              <h1 className="home-hero-title">{t.landing.heroTitle}</h1>
              <p className="home-hero-subtitle">{t.landing.heroSubtitle}</p>
              <div className="home-hero-actions">
                <LandingCtaLink
                  className="button-link button-link-accent home-hero-cta"
                  href={readingHref}
                  locale={locale}
                >
                  {t.landing.cta}
                </LandingCtaLink>
                <Link className="button-link home-secondary-link" href={buildBookHref(FEATURED_BOOK_ID, locale)} prefetch={false}>
                  {t.landing.browseCta}
                </Link>
              </div>
            </div>

            <figure className="home-hero-visual">
              {visualImage?.url ? (
                <img
                  className="home-hero-image"
                  src={visualImage.url}
                  alt={isEn ? "Comic panel from Romance of the Three Kingdoms" : "《三国演义》漫画阅读画面"}
                />
              ) : null}
              <figcaption className="home-hero-caption">
                <span>{t.landing.visualLabel}</span>
                <strong>{bookTitle}</strong>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="home-section home-section-light">
          <div className="container home-section-grid">
            <div>
              <p className="eyebrow">{t.landing.promiseEyebrow}</p>
              <h2 className="home-section-title">{t.landing.promiseTitle}</h2>
            </div>
            <p className="home-section-copy">{t.landing.promiseCopy}</p>
          </div>
          <div className="container home-feature-grid">
            {t.landing.promiseItems.map((item) => (
              <article className="home-feature-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section home-section-dark">
          <div className="container home-current-reading">
            <div>
              <p className="eyebrow eyebrow-dark">{t.landing.currentEyebrow}</p>
              <h2 className="home-section-title">{t.landing.currentTitle}</h2>
              <p className="home-section-copy home-section-copy-dark">{t.landing.currentCopy}</p>
            </div>
            <article className="home-reading-panel">
              <p className="home-reading-book">{bookTitle}</p>
              {bookSubtitle ? <p className="home-reading-subtitle">{bookSubtitle}</p> : null}
              {chapterTitle ? <h3>{chapterTitle}</h3> : null}
              {passageTitle ? <p className="home-reading-passage">{passageTitle}</p> : null}
              {passageCatchup ? <p className="home-reading-catchup">{passageCatchup}</p> : null}
              <div className="home-reading-actions">
                <LandingCtaLink className="button-link button-link-accent home-hero-cta" href={readingHref} locale={locale}>
                  {t.landing.startPassageCta}
                </LandingCtaLink>
                <Link className="button-link home-dark-link" href={comicHref} prefetch={false}>
                  {t.landing.comicCta}
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section className="home-section home-section-light">
          <div className="container home-section-grid">
            <div>
              <p className="eyebrow">{t.landing.libraryEyebrow}</p>
              <h2 className="home-section-title">{t.landing.libraryTitle}</h2>
            </div>
            <p className="home-section-copy">{t.landing.libraryCopy}</p>
          </div>
          <div className="container home-library-grid">
            {t.landing.libraryItems.map((item) => (
              <article className={`home-library-card ${item.status === "now" ? "home-library-card-active" : ""}`} key={item.title}>
                <span>{item.statusLabel}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section home-section-light">
          <div className="container home-process-grid">
            <div>
              <p className="eyebrow">{t.landing.processEyebrow}</p>
              <h2 className="home-section-title">{t.landing.processTitle}</h2>
              <p className="home-section-copy">{t.landing.processCopy}</p>
            </div>
            <ol className="home-process-list">
              {t.landing.processSteps.map((step) => (
                <li key={step.title}>
                  <span>{step.title}</span>
                  <p>{step.copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
