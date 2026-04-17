import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { AnalyticsRouteTracker } from "@/components/analytics-route-tracker";
import { GoogleAnalytics } from "@/components/google-analytics";
import "./globals.css";

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-reading-en",
  display: "swap",
});

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
      <body className={sourceSerif4.variable}>
        <GoogleAnalytics />
        <Suspense fallback={null}>
          <AnalyticsRouteTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
