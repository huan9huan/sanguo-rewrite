"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent } from "@/lib/client/analytics";
import type { Locale } from "@/lib/types";

type LandingCtaLinkProps = {
  href: string;
  className?: string;
  locale: Locale;
  children: ReactNode;
};

export function LandingCtaLink({ href, className, locale, children }: LandingCtaLinkProps) {
  return (
    <Link
      className={className}
      href={href}
      prefetch={false}
      onClick={() => {
        trackEvent("landing_cta_click", {
          locale,
          destination: href,
        });
        trackEvent("start_reading_click", {
          locale,
          destination: href,
        });
      }}
    >
      {children}
    </Link>
  );
}
