import "server-only";
import { existsSync } from "node:fs";
import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser } from "puppeteer-core";

/** أماكن Chrome/Edge المعتادة للتطوير المحلي (لو CHROME_EXECUTABLE_PATH مش متظبط) */
const LOCAL_BROWSERS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

async function launch(): Promise<Browser> {
  // على Vercel: Chromium المضغوط من @sparticuz/chromium
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true });
  }
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || LOCAL_BROWSERS.find((path) => existsSync(path));
  if (!executablePath) throw new Error("مفيش متصفح للـ PDF: حط مسار Chrome أو Edge في CHROME_EXECUTABLE_PATH");
  // Edge على ويندوز ساعات بيعيد تشغيل نفسه ويقفل (exit 0) من غير الفلاج ده
  return puppeteer.launch({ executablePath, headless: true, args: ["--edge-skip-compat-layer-relaunch"] });
}

/** بيفتح صفحة الطباعة في متصفح على السيرفر ويطلّعها PDF مقاس A4 */
export async function renderPdf(url: string): Promise<Uint8Array> {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0", timeout: 20_000 });
    // الخط العربي لازم يكون اتحمّل قبل الطباعة
    await page.evaluate(() => document.fonts.ready);
    return await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
  } finally {
    await browser.close();
  }
}
