import type { Metadata, Viewport } from "next";
import { plexArabic, plexLatin } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "سِجاف", template: "%s · سِجاف" },
  description: "نظام تسعير لمحلات الستائر",
  applicationName: "سِجاف",
};

export const viewport: Viewport = {
  themeColor: "#012a2d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${plexLatin.variable} ${plexArabic.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
