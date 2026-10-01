import type { QuoteDto, QuoteEventDto } from "@sijaf/shared";
import { CalendarPlus, ChevronRight, PencilLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PdfButton } from "@/components/features/quotes/pdf-button";
import { QuoteStatusBadge } from "@/components/features/quotes/quote-status-badge";
import { QuoteStatusForm } from "@/components/features/quotes/quote-status-form";
import { QuoteLines, QuoteSummary } from "@/components/features/quotes/quote-summary";
import { QuoteTimeline } from "@/components/features/quotes/quote-timeline";
import { publicQuotePath, quoteShareMessage } from "@/components/features/quotes/share";
import { CopyLinkButton, DuplicateButton, WhatsAppButton } from "@/components/features/quotes/share-buttons";
import { UserMenu } from "@/components/layout/user-menu";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api/server";
import { absoluteUrl } from "@/lib/app-url";
import { requireQuoter } from "@/lib/auth/session";
import { formatLongDate } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/quotes/[id]">): Promise<Metadata> {
  const { id } = await params;
  const quote = await apiRequest<QuoteDto>(`/quotes/${encodeURIComponent(id)}`);
  return { title: `عرض سعر #${quote.number}` };
}

export default async function QuotePage({ params }: PageProps<"/quotes/[id]">) {
  const { shop } = await requireQuoter();
  const { id } = await params;
  const [quote, events] = await Promise.all([
    apiRequest<QuoteDto>(`/quotes/${encodeURIComponent(id)}`),
    apiRequest<QuoteEventDto[]>(`/quotes/${encodeURIComponent(id)}/events`),
  ]);

  const priced = quote.tier !== null;
  const link = await absoluteUrl(publicQuotePath(quote.publicToken));
  const message = quoteShareMessage({ clientName: quote.client.name, shopName: shop.name, number: quote.number, total: quote.total, link });
  const alreadySent = quote.status !== "draft" && quote.status !== "review";
  const editHref = `/quotes/${quote.id}/${priced ? "pricing" : "details"}`;
  const sendLabel = alreadySent ? "إرسال تاني على واتساب" : "إرسال على واتساب";

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/quotes"
            aria-label="رجوع لعروض الأسعار"
            className="grid size-11 flex-none place-items-center rounded-sm border border-border-strong bg-surface text-ink hover:bg-surface-subtle md:size-10"
          >
            <ChevronRight aria-hidden className="size-5" />
          </Link>
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h1 className="m-0 text-lg font-bold text-ink md:text-2xl">عرض سعر #{quote.number}</h1>
              <QuoteStatusBadge status={quote.status} />
            </div>
            <span className="text-xs text-ink-muted">
              {quote.validUntil ? `صالح لحد ${formatLongDate(new Date(quote.validUntil))}` : "لسه ماتسعّرش"}
            </span>
          </div>
        </div>
        <div className="hidden md:block">
          <UserMenu />
        </div>
      </header>

      {/* الأزرار: صف كامل على التابلت واللابتوب، وعلى الموبايل تحت الإجمالي وواتساب ثابت تحت */}
      <div className="hidden flex-wrap gap-2 md:flex">
        {priced && <WhatsAppButton quoteId={quote.id} phone={quote.client.phone} message={message} label={sendLabel} />}
        {priced && <PdfButton token={quote.publicToken} number={quote.number} />}
        {priced && <CopyLinkButton url={link} />}
        <Link href={editHref} className={buttonStyles({ variant: "secondary" })}>
          {priced ? "تعديل العرض" : "كمّل العرض"}
          <PencilLine aria-hidden />
        </Link>
        <Link href={`/schedule?new=${quote.status === "accepted" ? "installation" : "inspection"}&quote=${quote.id}`} className={buttonStyles({ variant: "ghost" })}>
          تحديد موعد
          <CalendarPlus aria-hidden />
        </Link>
        <DuplicateButton quoteId={quote.id} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
        <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
          <QuoteSummary quote={quote} />
          {priced && <QuoteLines quote={quote} />}
          <div className="grid grid-cols-3 gap-2 md:hidden">
            {priced && <PdfButton token={quote.publicToken} number={quote.number} label="PDF" size="sm" className="h-11" />}
            {priced && <CopyLinkButton url={link} size="sm" className="h-11" />}
            <Link href={editHref} className={buttonStyles({ variant: "secondary", size: "sm", className: "h-11" })}>
              تعديل
              <PencilLine aria-hidden />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:gap-6">
          <Card className="flex flex-col gap-3">
            <CardTitle className="text-md">حالة العرض</CardTitle>
            <QuoteStatusForm quoteId={quote.id} status={quote.status} internalNotes={quote.internalNotes} finalTotal={quote.finalTotal} priced={priced} />
          </Card>
          <Card className="flex flex-col gap-3.5">
            <CardTitle className="text-md">سجل العرض</CardTitle>
            <QuoteTimeline events={events} />
          </Card>
          <DuplicateButton quoteId={quote.id} variant="secondary" block className="md:hidden" />
        </div>
      </div>

      {priced && (
        <div className="sticky bottom-20 z-10 md:hidden">
          <WhatsAppButton quoteId={quote.id} phone={quote.client.phone} message={message} label={sendLabel} size="lg" block className="shadow-raised" />
        </div>
      )}
    </>
  );
}
