import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { FutureBookForm } from "@/components/future-book-form";

export default async function HomePage() {
  return (
    <div className="page-shell home-hero-page">
      <main>
        <section className="home-hero">
          <div className="container home-hero-inner">
            <h1 className="home-hero-title">让中国经典更加生动</h1>
            <div className="home-hero-actions">
              <Link className="button-link button-link-accent home-hero-cta" href="/read">
                Start Reading 《三国演义》
              </Link>
            </div>
          </div>
        </section>

        <section className="future-books-section">
          <div className="container">
            <h2 className="future-books-heading">下一本读什么？</h2>
            <FutureBookForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
