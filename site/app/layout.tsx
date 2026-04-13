import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AnalyticsRouteTracker } from "@/components/analytics-route-tracker";
import { GoogleAnalytics } from "@/components/google-analytics";
import "./globals.css";

export const metadata: Metadata = {
  title: "Read Chinese Classics - 让中国经典更加生动.",
  description: "Read Chinese Classics in a more vivid, story-first way.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-CN">
      <body>
        <GoogleAnalytics />
        <Suspense fallback={null}>
          <AnalyticsRouteTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
