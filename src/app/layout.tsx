import type { Metadata, Viewport } from "next";

import "./globals.css";
import { Providers } from "./providers";

export const viewport: Viewport = { themeColor: "#FF7A00" };

export const metadata: Metadata = {
  title: "جيبلي",
  description: "اطلب طعامك من مطاعم بريان بسهولة",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
