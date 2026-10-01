import type { Metadata } from "next";
import { publicLogoSrc, publicPhotoSrc } from "@/components/features/quotes/media";
import { QuoteDocument } from "@/components/features/quotes/quote-document";
import { getPublicQuote } from "../data";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** العرض لوحده من غير أزرار: الـ PDF بيتطبع من الصفحة دي */
export default async function PrintQuotePage({ params }: PageProps<"/q/[token]/print">) {
  const { token } = await params;
  const quote = await getPublicQuote(token);

  return (
    <main className="bg-surface print:p-0">
      <style>{"@page { size: A4; margin: 14mm 12mm; } html, body { background: var(--color-surface); }"}</style>
      <QuoteDocument
        quote={quote}
        shop={quote.shop}
        photoSrc={publicPhotoSrc(token, quote.hasPhoto)}
        logoSrc={publicLogoSrc(token, quote.shop.hasLogo)}
        className="mx-auto max-w-none px-0 py-0 shadow-none md:px-0 md:py-0"
      />
    </main>
  );
}
