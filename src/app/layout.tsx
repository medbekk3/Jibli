import { Alexandria } from "next/font/google";
import type { Metadata, Viewport } from "next";

import "./globals.css";
import { Providers } from "./providers";

const alexandria = Alexandria({ subsets: ["arabic", "latin"], variable: "--font-alexandria", display: "swap" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FF7A00",
};

export const metadata: Metadata = {
  title: "جيبلي",
  description: "جيبلي… كل مطاعم بريان في مكان واحد",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl" data-scroll-behavior="smooth"><body className={alexandria.variable}><Providers>{children}</Providers></body></html>;
}
