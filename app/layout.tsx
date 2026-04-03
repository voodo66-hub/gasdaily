import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "工业气体日报 | Air Liquide 京津冀",
  description: "工业气体每日行情与资讯，涵盖液氧、液氮、液氩价格趋势及行业动态",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
