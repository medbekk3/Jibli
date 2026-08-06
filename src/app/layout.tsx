import type { Metadata, Viewport } from "next";

import "./globals.css";
import { Providers } from "./providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FF7A00",
};

export const metadata: Metadata = {
  title: "جيبلي",
  description: "\u062c\u064a\u0628\u0644\u064a\u2026 \u0643\u0644 \u0645\u0637\u0627\u0639\u0645 \u0628\u0631\u064a\u0627\u0646 \u0641\u064a \u0645\u0643\u0627\u0646 \u0648\u0627\u062d\u062f",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
