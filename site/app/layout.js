import "./globals.css";

export const metadata = {
  title: "Sanguo Rewrite",
  description: "A story-first rewrite studio for Romance of the Three Kingdoms.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
