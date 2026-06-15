import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "유니콘 시티 — 회사 경영 & 주식 투자 게임 | by Dustin",
  description:
    "학생들을 위한 회사 경영·주식 투자 교육 게임. 회사를 심시티처럼 키우고, 다양한 자산에 투자하며 순자산 1위에 도전하세요. 제작: Dustin · Teacher, Data Analytics, App Developer",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
