import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Chromium للـ PDF: بيتحمّل من node_modules زي ما هو، ومايتعملوش bundle
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/q/[token]/pdf": ["../../node_modules/@sparticuz/chromium/bin/**"],
  },
};

export default nextConfig;
