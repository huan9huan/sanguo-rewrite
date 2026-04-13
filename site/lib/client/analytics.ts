"use client";

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      command: "js" | "config" | "event" | "set",
      targetId: string | Date,
      params?: AnalyticsParams,
    ) => void;
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

function isAnalyticsEnabled(): boolean {
  return typeof window !== "undefined" && Boolean(GA_MEASUREMENT_ID) && typeof window.gtag === "function";
}

function cleanParams(params: AnalyticsParams = {}): AnalyticsParams {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

export function getGaMeasurementId(): string {
  return GA_MEASUREMENT_ID;
}

export function trackPageView(path: string, params: AnalyticsParams = {}) {
  if (!isAnalyticsEnabled()) return;

  window.gtag!("event", "page_view", cleanParams({
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
    ...params,
  }));
}

export function trackEvent(name: string, params: AnalyticsParams = {}) {
  if (!isAnalyticsEnabled()) return;
  window.gtag!("event", name, cleanParams(params));
}
