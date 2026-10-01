import { formatEgyptianMobile, tierLabels, type QuoteDto, type ShopDto } from "@sijaf/shared";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { formatCurrency, formatDimensions, formatLongDate, formatShortDate } from "@/lib/format";
import { curtainTitle, groupQuoteLines, windowsText } from "./quote-format";

type QuoteDocumentProps = {
  quote: QuoteDto;
  shop: Pick<ShopDto, "name" | "whatsapp" | "logoUrl">;
  /** الصورة: من الـ API جوه التطبيق، أو رابط عام في صفحة العميل */
  photoSrc: string | null;
  className?: string;
};

/** عرض السعر زي ما العميل بيشوفه (العرض النهائي، وصفحة العميل والـ PDF في المرحلة 5) */
export function QuoteDocument({ quote, shop, photoSrc, className }: QuoteDocumentProps) {
  const size =
    quote.widthCm && quote.heightCm
      ? `${formatDimensions(quote.widthCm, quote.heightCm)}${quote.windowCount > 1 ? ` · ${windowsText(quote.windowCount)}` : ""}`
      : "—";
  const facts = [
    ["العميل", quote.client.name],
    ["نوع الستارة", curtainTitle(quote.roomLabel, quote.modelName)],
    ["المقاس", size],
    ["المستوى", quote.tier ? tierLabels[quote.tier] : "—"],
    ["التاريخ", formatShortDate(new Date(quote.createdAt))],
  ] as const;

  return (
    <article aria-label="معاينة عرض السعر" className={cn("@container flex w-full max-w-160 flex-col gap-4.5 rounded-md bg-surface px-5 py-6 shadow-raised md:px-8 md:py-7", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          {shop.logoUrl ? (
            <Image src={shop.logoUrl} alt={`شعار ${shop.name}`} width={44} height={44} unoptimized className="size-11 rounded-md object-contain" />
          ) : (
            <span aria-hidden className="grid size-11 place-items-center rounded-md border border-dashed border-border-strong bg-surface-subtle text-sm font-bold text-ink-muted">
              {shop.name.slice(0, 2)}
            </span>
          )}
          <div className="flex flex-col">
            <span className="text-lg font-bold text-ink">{shop.name}</span>
            {shop.whatsapp && (
              <span dir="ltr" className="text-end text-xs text-ink-muted">
                {formatEgyptianMobile(shop.whatsapp)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-bold text-ink">عرض سعر</span>
          <span className="text-xs text-ink-muted">رقم #{quote.number}</span>
        </div>
      </header>

      <div className="flex flex-col-reverse gap-5 @min-[30rem]:flex-row">
        <dl className="m-0 flex grow flex-col gap-2.5">
          {facts.map(([label, value]) => (
            <div key={label} className="flex gap-3 text-sm">
              <dt className="w-24 flex-none text-ink-muted">{label}</dt>
              <dd className="m-0 font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="relative h-37.5 w-full flex-none overflow-hidden rounded-md border border-border bg-surface-subtle @min-[30rem]:w-50">
          {photoSrc ? (
            <Image src={photoSrc} alt="صورة الستارة" fill unoptimized className="object-cover" sizes="200px" />
          ) : (
            <span className="grid h-full place-items-center text-ink-muted">
              <ImageIcon aria-hidden className="size-7" />
            </span>
          )}
        </div>
      </div>

      <dl className="m-0">
        {groupQuoteLines(quote.items).map((group) => (
          <div key={group.label} className="flex justify-between border-b border-border py-2 text-sm">
            <dt>{group.label}</dt>
            <dd className="m-0 font-semibold text-ink">{formatCurrency(group.total)}</dd>
          </div>
        ))}
        {quote.discount > 0 && (
          <div className="flex justify-between border-b border-border py-2 text-sm">
            <dt>خصم</dt>
            <dd className="m-0 font-semibold text-growth">- {formatCurrency(quote.discount)}</dd>
          </div>
        )}
      </dl>

      <div className="flex items-end justify-between gap-3 rounded-md bg-primary-soft px-5 py-4">
        <div className="flex flex-col text-ink-2">
          <span className="text-sm">الإجمالي</span>
          <span className="text-xs">العربون المطلوب: {formatCurrency(quote.depositAmount)}</span>
        </div>
        <span className="text-[32px] font-bold leading-10 text-ink">{formatCurrency(quote.total)}</span>
      </div>
      <p className="m-0 text-xs text-ink-muted">
        السعر تقديري ويتأكد بعد المعاينة.
        {quote.validUntil && ` العرض ساري لحد ${formatLongDate(new Date(quote.validUntil))}.`}
      </p>
    </article>
  );
}
