import { formatEgyptianMobile, operationLabels, tierLabels, type QuoteDto } from "@sijaf/shared";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatCurrency, formatDimensions } from "@/lib/format";
import { QuotePhoto } from "./quote-photo";
import { shortModelName, windowsText } from "./quote-format";

function modelText(quote: QuoteDto): string {
  return quote.modelName ? `${shortModelName(quote.modelName)} · ${operationLabels[quote.operation]}` : "—";
}

function sizeText(quote: QuoteDto): string {
  return quote.widthCm && quote.heightCm ? formatDimensions(quote.widthCm, quote.heightCm) : "—";
}

/** الصورة وبيانات العميل والستارة: شبكة على الشاشات الكبيرة، وسطور على الموبايل */
export function QuoteSummary({ quote }: { quote: QuoteDto }) {
  const facts = [
    ["العميل", quote.client.name],
    ["الموبايل", <span key="phone" dir="ltr">{formatEgyptianMobile(quote.client.phone)}</span>],
    ["المنطقة", quote.client.area || "—"],
    ["الموديل", modelText(quote)],
    ["المقاس", quote.widthCm ? `${sizeText(quote)} · ${windowsText(quote.windowCount)}` : "—"],
    ["المستوى", quote.tier ? tierLabels[quote.tier] : "—"],
  ] as const;

  return (
    <section aria-label="بيانات العرض" className="flex gap-4 rounded-lg border border-border bg-surface p-3 shadow-card md:gap-6 md:p-5">
      <QuotePhoto quoteId={quote.id} photoCount={quote.photoCount} className="aspect-auto h-24 w-24 flex-none md:h-42.5 md:w-50" />
      <dl className="m-0 hidden grow grid-cols-2 content-start gap-x-5 gap-y-4 md:grid xl:grid-cols-3">
        {facts.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-ink-muted">{label}</dt>
            <dd className="m-0 text-sm font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex min-w-0 flex-col gap-0.5 md:hidden">
        <span className="text-md font-bold text-ink">{quote.client.name}</span>
        <span className="text-sm text-ink-2">{quote.modelName ? `${shortModelName(quote.modelName)} · ${sizeText(quote)}` : sizeText(quote)}</span>
        {quote.tier && <span className="text-sm text-ink-2">مستوى {tierLabels[quote.tier]}</span>}
        <span dir="ltr" className="text-end text-sm text-ink-muted">
          {formatEgyptianMobile(quote.client.phone)}
        </span>
      </div>
    </section>
  );
}

const columns: DataTableColumn<QuoteDto["items"][number]>[] = [
  { id: "label", header: "البند", cell: (item) => item.label },
  { id: "quantity", header: "الكمية", cell: (item) => item.quantityLabel, className: "whitespace-nowrap" },
  { id: "total", header: "الإجمالي", cell: (item) => formatCurrency(item.total), numeric: true },
];

/** البنود والإجمالي والعربون */
export function QuoteLines({ quote }: { quote: QuoteDto }) {
  return (
    <section aria-label="بنود العرض" className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <DataTable label="بنود العرض" columns={columns} rows={quote.items} getRowKey={(item) => item.key} className="hidden md:block" />
      {quote.discount > 0 && (
        <div className="hidden justify-between border-t border-border px-4 py-3 text-sm md:flex">
          <span>خصم</span>
          <span className="font-semibold text-growth">- {formatCurrency(quote.discount)}</span>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 bg-primary-soft px-5 py-3.5">
        <span className="flex flex-col text-sm text-ink-2 md:flex-row md:gap-1">
          <span>الإجمالي</span>
          <span className="text-xs md:text-sm">
            <span className="hidden md:inline">· </span>العربون المطلوب {formatCurrency(quote.depositAmount)}
          </span>
        </span>
        <span className="text-2xl font-bold text-ink">{formatCurrency(quote.total)}</span>
      </div>
    </section>
  );
}
