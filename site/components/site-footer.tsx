export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <span className="site-footer-trademark">
          © {new Date().getFullYear()} Read Chinese Classics
        </span>
      </div>
    </footer>
  );
}
