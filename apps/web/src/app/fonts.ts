import localFont from "next/font/local";

// الخط متقسّم لملفين: Latin (للأرقام والحروف اللاتيني) الأول، وبعده العربي.
export const plexLatin = localFont({
  variable: "--font-plex-latin",
  display: "swap",
  src: [
    { path: "./fonts/IBMPlexSansArabic-latin-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexSansArabic-latin-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/IBMPlexSansArabic-latin-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/IBMPlexSansArabic-latin-700.woff2", weight: "700", style: "normal" },
  ],
});

export const plexArabic = localFont({
  variable: "--font-plex-arabic",
  display: "swap",
  src: [
    { path: "./fonts/IBMPlexSansArabic-arabic-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexSansArabic-arabic-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/IBMPlexSansArabic-arabic-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/IBMPlexSansArabic-arabic-700.woff2", weight: "700", style: "normal" },
  ],
});
