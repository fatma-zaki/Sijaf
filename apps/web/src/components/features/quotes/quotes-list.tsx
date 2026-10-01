import { formatEgyptianMobile, tierLabels, type QuoteListItemDto } from "@sijaf/shared";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatCurrency, formatRelativeDateTime } from "@/lib/format";
import { curtainTitle } from "./quote-format";
import { QuoteStatusBadge } from "./quote-status-badge";

const price = (quote: QuoteListItemDto) => (quote.tier ? formatCurrency(quote.total) : "—");
const date = (quote: QuoteListItemDto) => formatRelativeDateTime(new Date(quote.createdAt));
const href = (quote: QuoteListItemDto) => `/quotes/${quote.id}`;

/** التابلت بيجمع عمودين في عمود، فالعنوان أقصر */
function ResponsiveHeader({ short, full }: { short: string; full: string }) {
  return (
    <>
      <span className="lg:hidden">{short}</span>
      <span className="hidden lg:inline">{full}</span>
    </>
  );
}

const columns: DataTableColumn<QuoteListItemDto>[] = [
  {
    id: "number",
    header: <ResponsiveHeader short="رقم" full="رقم العرض" />,
    cell: (quote) => (
      <Link href={href(quote)} className="font-semibold text-link">
        #{quote.number}
      </Link>
    ),
  },
  {
    id: "client",
    header: "العميل",
    cell: (quote) => (
      <span className="flex flex-col">
        <span className="font-semibold text-ink">{quote.clientName}</span>
        <span className="text-xs text-ink-muted lg:hidden">{date(quote)}</span>
      </span>
    ),
  },
  {
    id: "phone",
    header: "الموبايل",
    visibleFrom: "lg",
    cell: (quote) => <span dir="ltr">{formatEgyptianMobile(quote.clientPhone)}</span>,
    className: "whitespace-nowrap",
  },
  {
    id: "curtain",
    header: <ResponsiveHeader short="الستارة" full="نوع الستارة" />,
    cell: (quote) => (
      <span className="flex flex-col">
        <span>{curtainTitle(quote.roomLabel, null)}</span>
        {quote.tier && <span className="text-xs text-ink-muted lg:hidden">مستوى {tierLabels[quote.tier]}</span>}
      </span>
    ),
  },
  { id: "tier", header: "المستوى", visibleFrom: "lg", cell: (quote) => (quote.tier ? tierLabels[quote.tier] : "—") },
  { id: "price", header: "السعر", numeric: true, cell: price },
  { id: "status", header: "الحالة", cell: (quote) => <QuoteStatusBadge status={quote.status} /> },
  { id: "date", header: "التاريخ", visibleFrom: "lg", cell: date, className: "whitespace-nowrap" },
  {
    id: "open",
    header: <span className="sr-only">فتح</span>,
    cell: (quote) => (
      <Link
        href={href(quote)}
        aria-label={`فتح عرض #${quote.number}`}
        className="grid size-8 place-items-center rounded-sm text-ink-muted hover:bg-surface-subtle hover:text-ink"
      >
        <ChevronLeft aria-hidden className="size-4" />
      </Link>
    ),
  },
];

/** التابلت واللابتوب */
export function QuotesTable({ quotes }: { quotes: QuoteListItemDto[] }) {
  return <DataTable label="عروض الأسعار" columns={columns} rows={quotes} getRowKey={(quote) => quote.id} />;
}

/** الموبايل: كارت لكل عرض زي التصميم */
export function QuoteCards({ quotes }: { quotes: QuoteListItemDto[] }) {
  return (
    <ul aria-label="عروض الأسعار" className="m-0 flex list-none flex-col gap-2.5 p-0">
      {quotes.map((quote) => (
        <li key={quote.id}>
          <Link
            href={href(quote)}
            className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3.5 text-ink no-underline shadow-card hover:bg-surface-subtle hover:text-ink"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-md font-semibold">{quote.clientName}</span>
              <QuoteStatusBadge status={quote.status} />
            </span>
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-ink-muted">
                #{quote.number} · {curtainTitle(quote.roomLabel, null)} · {date(quote)}
              </span>
              <span className="whitespace-nowrap text-md font-bold">{price(quote)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
