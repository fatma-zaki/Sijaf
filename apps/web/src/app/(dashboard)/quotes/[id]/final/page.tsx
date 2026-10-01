import type { QuoteDto } from "@sijaf/shared";
import { CalendarPlus, PencilLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { quotePhotoSrc, shopLogoSrc } from "@/components/features/quotes/media";
import { QuoteDocument } from "@/components/features/quotes/quote-document";
import { publicQuotePath, quoteShareMessage } from "@/components/features/quotes/share";
import { PdfButton } from "@/components/features/quotes/pdf-button";
import { CopyLinkButton, WhatsAppButton } from "@/components/features/quotes/share-buttons";
import { WizardHeader } from "@/components/features/quotes/wizard-header";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api/server";
import { absoluteUrl } from "@/lib/app-url";
import { requireQuoter } from "@/lib/auth/session";

export const metadata: Metadata = { title: "عرض السعر جاهز" };

export default async function FinalPage({ params }: PageProps<"/quotes/[id]/final">) {
  const { shop } = await requireQuoter();
  const { id } = await params;
  const quote = await apiRequest<QuoteDto>(`/quotes/${encodeURIComponent(id)}`);
  if (!quote.tier) redirect(`/quotes/${quote.id}/pricing`);
  const link = await absoluteUrl(publicQuotePath(quote.publicToken));
  const message = quoteShareMessage({ clientName: quote.client.name, shopName: shop.name, number: quote.number, total: quote.total, link });

  return (
    <>
      <WizardHeader
        step={3}
        title="عرض السعر جاهز!"
        subtitle="راجع العرض وابعته للعميل على واتساب، أو حمّله كملف PDF"
        backHref={`/quotes/${quote.id}/pricing`}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
        <div className="flex justify-center">
          <QuoteDocument quote={quote} shop={shop} photoSrc={quotePhotoSrc(quote)} logoSrc={shopLogoSrc(shop)} />
        </div>
        <Card className="flex h-max flex-col gap-3">
          <CardTitle className="text-md">إرسال العرض</CardTitle>
          <WhatsAppButton block quoteId={quote.id} phone={quote.client.phone} message={message} />
          <PdfButton block token={quote.publicToken} number={quote.number} />
          <CopyLinkButton block url={link} label="نسخ رابط العرض" />
          <p className="m-0 text-xs text-ink-muted">العميل بيفتح الرابط من غير تسجيل دخول، وبتعرف من سجل العرض إنه فتحه.</p>
          <div role="separator" className="my-1 h-px bg-border" />
          <Link href={`/schedule?new=inspection&quote=${quote.id}`} className={buttonStyles({ variant: "secondary", block: true })}>
            تحديد موعد معاينة
            <CalendarPlus aria-hidden />
          </Link>
          <Link href={`/quotes/${quote.id}/pricing`} className={buttonStyles({ variant: "ghost", block: true })}>
            تعديل العرض
            <PencilLine aria-hidden />
          </Link>
        </Card>
      </div>
      <div className="mt-auto">
        <Link href={`/quotes/${quote.id}`} className={buttonStyles({ variant: "secondary" })}>
          صفحة العرض والسجل
        </Link>
      </div>
    </>
  );
}
