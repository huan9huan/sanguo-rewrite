type SiteMarkProps = {
  className?: string;
  label?: string;
  showWordmark?: boolean;
};

export function SiteMark({
  className,
  label = "Read Chinese Classics",
  showWordmark = false,
}: SiteMarkProps) {
  return (
    <div className={className}>
      <svg
        className="site-mark-symbol"
        viewBox="0 0 96 96"
        role="img"
        aria-label={label}
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>{label}</title>
        <rect x="8" y="8" width="80" height="80" rx="20" className="site-mark-background" />
        <rect x="16" y="18" width="10" height="60" rx="5" className="site-mark-bamboo site-mark-bamboo-light" />
        <rect x="29" y="18" width="10" height="60" rx="5" className="site-mark-bamboo site-mark-bamboo-mid" />
        <rect x="43" y="18" width="10" height="60" rx="5" className="site-mark-bamboo site-mark-bamboo-dark" />
        <rect x="57" y="18" width="10" height="60" rx="5" className="site-mark-bamboo site-mark-bamboo-mid" />
        <rect x="70" y="18" width="10" height="60" rx="5" className="site-mark-bamboo site-mark-bamboo-light" />
        <g className="site-mark-grooves">
          <path d="M16 33H26" />
          <path d="M29 33H39" />
          <path d="M43 33H53" />
          <path d="M57 33H67" />
          <path d="M70 33H80" />
          <path d="M16 48H26" />
          <path d="M29 48H39" />
          <path d="M43 48H53" />
          <path d="M57 48H67" />
          <path d="M70 48H80" />
          <path d="M16 63H26" />
          <path d="M29 63H39" />
          <path d="M43 63H53" />
          <path d="M57 63H67" />
          <path d="M70 63H80" />
        </g>
        <g className="site-mark-cores">
          <path d="M21 24V72" />
          <path d="M34 24V72" />
          <path d="M48 24V72" />
          <path d="M62 24V72" />
          <path d="M75 24V72" />
        </g>
      </svg>
      {showWordmark ? (
        <span className="site-mark-wordmark">
          <span className="site-mark-title">Read Chinese Classics</span>
          <span className="site-mark-subtitle">AI reinterpretation for open reading</span>
        </span>
      ) : null}
    </div>
  );
}
