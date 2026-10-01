import { tierLabels } from "@sijaf/shared";
import { MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import { publicLogoSrc, publicPhotoSrc } from "@/components/features/quotes/media";
import { OpenedBeacon } from "@/components/features/quotes/opened-beacon";
import { PdfButton } from "@/components/features/quotes/pdf-button";
import { QuoteDocument } from "@/components/features/quotes/quote-document";
import { curtainTitle, isQuoteExpired } from "@/components/features/quotes/quote-format";
import { shopContactMessage, whatsAppUrl } from "@/components/features/quotes/share";
import { buttonStyles } from "@/components/ui/button";
import { InfoNote } from "@/components/ui/info-note";
import { Logo } from "@/components/ui/logo";
import { absoluteUrl } from "@/lib/app-url";
import { formatCurrency, formatLongDate } from "@/lib/format";
import { getPublicQuote } from "./data";

export async function generateMetadata({ params }: PageProps<"/q/[token]">): Promise<Metadata> {
  const { token } = await params;
  const quote = await getPublicQuote(token);
  const title = `عرض سعر #${quote.number} · ${quote.shop.name}`;
  const description = [
    curtainTitle(quote.roomLabel, quote.modelName),
    quote.tier ? `مستوى ${tierLabels[quote.tier]}` : null,
    `الإجمالي ${formatCurrency(quote.total)}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const photo = publicPhotoSrc(token, quote.hasPhoto);
  return {
    title: { absolute: title },
    description,
    // الرابط خاص بالعميل: مايظهرش في محركات البحث
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ar_EG",
      siteName: quote.shop.name,
      ...(photo ? { images: [{ url: await absoluteUrl(photo), alt: "صورة الستارة" }] } : {}),
    },
  };
}

/** صفحة العميل: العرض نفسه (read-only)، وكلام المحل على واتساب، والـ PDF */
export default async function PublicQuotePage({ params }: PageProps<"/q/[token]">) {
  const { token } = await params;
  const quote = await getPublicQuote(token);
  const expired = isQuoteExpired(quote.validUntil);

  return (
    <main className="min-h-dvh bg-canvas px-4 py-6 md:py-10">
      <div className="mx-auto flex max-w-160 flex-col gap-4">
        {expired && quote.validUntil && (
          <InfoNote tone="warning">
            العرض ده كان ساري لحد {formatLongDate(new Date(quote.validUntil))}. كلّم المحل يأكدلك الأسعار قبل ما تتفق.
          </InfoNote>
        )}
        {quote.status === "accepted" && <InfoNote tone="success">وافقت على العرض ده، والمحل هيتواصل معاك عشان ميعاد التركيب.</InfoNote>}

        <QuoteDocument
          quote={quote}
          shop={quote.shop}
          photoSrc={publicPhotoSrc(token, quote.hasPhoto)}
          logoSrc={publicLogoSrc(token, quote.shop.hasLogo)}
        />

        <div className="flex flex-col gap-3 md:flex-row">
          {quote.shop.whatsapp && (
            <a
              href={whatsAppUrl(quote.shop.whatsapp, shopContactMessage(quote.number))}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ size: "lg", className: "md:flex-1" })}
            >
              كلّم {quote.shop.name} على واتساب
              <MessageCircle aria-hidden />
            </a>
          )}
          <PdfButton token={token} number={quote.number} size="lg" className="md:flex-1" />
        </div>
        {quote.shop.address && <p className="m-0 text-center text-sm text-ink-2">العنوان: {quote.shop.address}</p>}

        <footer className="flex items-center justify-center gap-2 pt-4 text-xs text-ink-muted">
          اتعمل بـ
          <Logo size="sm" className="text-ink" />
        </footer>
      </div>
      <OpenedBeacon token={token} />
    </main>
  );
}
