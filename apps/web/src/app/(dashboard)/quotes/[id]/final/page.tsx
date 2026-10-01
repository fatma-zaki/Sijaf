import type { QuoteDto } from "@sijaf/shared";
import { CalendarPlus, Copy, FileDown, MessageCircle, PencilLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { QuoteDocument } from "@/components/features/quotes/quote-document";
import { WizardHeader } from "@/components/features/quotes/wizard-header";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api/server";
import { requireQuoter } from "@/lib/auth/session";

export const metadata: Metadata = { title: "عرض السعر جاهز" };

export default async function FinalPage({ params }: PageProps<"/quotes/[id]/final">) {
  const { shop } = await requireQuoter();
  const { id } = await params;
  const quote = await apiRequest<QuoteDto>(`/quotes/${encodeURIComponent(id)}`);
  if (!quote.tier) redirect(`/quotes/${quote.id}/pricing`);
  const photoSrc = quote.photoCount > 0 ? `/api/quotes/${quote.id}/photos/${quote.photoCount - 1}` : null;

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
          <QuoteDocument quote={quote} shop={shop} photoSrc={photoSrc} />
        </div>
        <Card className="flex h-max flex-col gap-3">
          <CardTitle className="text-md">إرسال العرض</CardTitle>
          {/* واتساب والـ PDF ورابط العميل جايين في المرحلة 5 */}
          <Button block disabled>
            إرسال عبر واتساب
            <MessageCircle aria-hidden />
          </Button>
          <Button variant="secondary" block disabled>
            تحميل PDF
            <FileDown aria-hidden />
          </Button>
          <Button variant="secondary" block disabled>
            نسخ رابط العرض
            <Copy aria-hidden />
          </Button>
          <p className="m-0 text-xs text-ink-muted">الإرسال على واتساب والـ PDF ورابط العميل جايين في المرحلة 5.</p>
          <div role="separator" className="my-1 h-px bg-border" />
          <Button variant="secondary" block disabled>
            تحديد موعد معاينة
            <CalendarPlus aria-hidden />
          </Button>
          <Link href={`/quotes/${quote.id}/pricing`} className={buttonStyles({ variant: "ghost", block: true })}>
            تعديل العرض
            <PencilLine aria-hidden />
          </Link>
        </Card>
      </div>
      <div className="mt-auto">
        <Link href="/" className={buttonStyles({ variant: "secondary" })}>
          الرجوع للرئيسية
        </Link>
      </div>
    </>
  );
}
