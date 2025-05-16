import "./globals.css";
import type { Metadata, Viewport } from "next";
import React from "react";
import Umami from "@/components/umami";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: "科技拯救衍天",
  description:
    "AI 算卦 - 通过进行六次硬币的随机卜筮，生成卦象，并使用 AI 对卦象进行分析｜AI 算命、在线算命、在线算卦、周易易经64卦",
  appleWebApp: {
    title: "衍天宗 算卦",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f4" },
    { media: "(prefers-color-scheme: dark)", color: "#333333" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cn" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://registry.npmmirror.com/lxgw-wenkai-screen-web/latest/files/lxgwwenkaiscreen/result.css"
        />
      </head>
      <body>
        <ThemeProvider
          enableSystem
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Umami />
      </body>
    </html>
  );
}
