"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent, type AnalyticsParams } from "@/lib/client/analytics";

type AnalyticsLinkProps = {
  href: string;
  className?: string;
  prefetch?: boolean;
  eventName: string;
  eventParams?: AnalyticsParams;
  children: ReactNode;
};

export function AnalyticsLink({
  href,
  className,
  prefetch,
  eventName,
  eventParams,
  children,
}: AnalyticsLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      prefetch={prefetch}
      onClick={() => {
        trackEvent(eventName, eventParams);
      }}
    >
      {children}
    </Link>
  );
}
