import Link from "next/link";

type ModeHeaderProps = {
  mode: "reader" | "creator";
};

export function ModeHeader({ mode }: ModeHeaderProps) {
  return (
    <header className="site-header">
      <div className="container header-row">
        <div>
          <p className="eyebrow">Story Rewrite Studio</p>
          <Link href="/" className="site-title">
            Sanguo Rewrite
          </Link>
        </div>
        <nav className="mode-nav">
          <Link className={`mode-link ${mode === "reader" ? "mode-link-accent" : ""}`} href="/reader">
            阅读者模式
          </Link>
          <Link className={`mode-link ${mode === "creator" ? "mode-link-accent" : ""}`} href="/creator">
            创作者模式
          </Link>
        </nav>
      </div>
    </header>
  );
}
