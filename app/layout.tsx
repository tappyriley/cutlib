import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "컷 아카이브",
  description: "Tappytoon 이벤트 컷 모음 라이브러리",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-surface-2">
        <header className="sticky top-0 z-40 bg-white border-b border-border backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 group">
              <span className="w-7 h-7 rounded bg-accent flex items-center justify-center text-white text-xs font-bold">
                컷
              </span>
              <span className="font-semibold text-ink text-sm tracking-tight">
                컷 아카이브
              </span>
            </a>
            <span className="text-xs text-ink-faint">Tappytoon</span>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
