import { clientTagLabels, formatEgyptianMobile, type ClientListItemDto, type ClientTag } from "@sijaf/shared";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import { formatCurrency, formatRelativeDay } from "@/lib/format";
import { quotesCountText } from "../quotes/quote-format";
import { whatsAppUrl } from "../quotes/share";

const tagTones: Record<ClientTag, BadgeTone> = { repeat: "success", new: "info", followup: "warning" };

function ClientTagBadge({ tag }: { tag: ClientTag | null }) {
  return tag ? <StatusBadge tone={tagTones[tag]}>{clientTagLabels[tag]}</StatusBadge> : <span className="text-ink-muted">—</span>;
}

function WhatsAppLink({ client }: { client: ClientListItemDto }) {
  return (
    <a
      href={whatsAppUrl(client.phone, `أهلاً ${client.name.split(/\s+/)[0]}`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`مراسلة ${client.name} على واتساب`}
      className={buttonStyles({ variant: "ghost", iconOnly: true })}
    >
      <MessageCircle aria-hidden />
    </a>
  );
}

const accepted = (client: ClientListItemDto) => (client.acceptedTotal > 0 ? formatCurrency(client.acceptedTotal) : "—");

/** اسم العميل بيفتح عروضه (البحث برقمه) للي بيعملوا عروض */
function ClientName({ client, linkQuotes }: { client: ClientListItemDto; linkQuotes: boolean }) {
  return linkQuotes && client.quoteCount > 0 ? (
    <Link href={`/quotes?q=${client.phone}`} className="font-semibold text-ink">
      {client.name}
    </Link>
  ) : (
    <span className="font-semibold text-ink">{client.name}</span>
  );
}

export function ClientsTable({ clients, linkQuotes }: { clients: ClientListItemDto[]; linkQuotes: boolean }) {
  const columns: DataTableColumn<ClientListItemDto>[] = [
    { id: "name", header: "العميل", cell: (client) => <ClientName client={client} linkQuotes={linkQuotes} /> },
    { id: "phone", header: "الموبايل", cell: (client) => <span dir="ltr">{formatEgyptianMobile(client.phone)}</span>, className: "whitespace-nowrap" },
    { id: "area", header: "المنطقة", cell: (client) => client.area || "—" },
    { id: "count", header: "عدد العروض", cell: (client) => client.quoteCount, visibleFrom: "lg" },
    {
      id: "last",
      header: "آخر عرض",
      cell: (client) => (client.lastQuoteAt ? formatRelativeDay(new Date(client.lastQuoteAt)) : "—"),
      visibleFrom: "lg",
    },
    { id: "accepted", header: "قيمة المقبول", numeric: true, cell: accepted },
    { id: "tag", header: "الحالة", cell: (client) => <ClientTagBadge tag={client.tag} /> },
    { id: "whatsapp", header: <span className="sr-only">واتساب</span>, cell: (client) => <WhatsAppLink client={client} /> },
  ];
  return <DataTable label="العملاء" columns={columns} rows={clients} getRowKey={(client) => client.id} />;
}

export function ClientCards({ clients, linkQuotes }: { clients: ClientListItemDto[]; linkQuotes: boolean }) {
  return (
    <ul aria-label="العملاء" className="m-0 flex list-none flex-col gap-2.5 p-0">
      {clients.map((client) => (
        <li key={client.id} className="flex items-center gap-2 rounded-md border border-border bg-surface p-3.5 shadow-card">
          <div className="flex min-w-0 grow flex-col gap-1.5">
            <span className="flex items-center justify-between gap-2">
              <ClientName client={client} linkQuotes={linkQuotes} />
              <ClientTagBadge tag={client.tag} />
            </span>
            <span className="truncate text-xs text-ink-muted">
              {[client.area, quotesCountText(client.quoteCount), `مقبول ${accepted(client)}`].filter(Boolean).join(" · ")}
            </span>
          </div>
          <WhatsAppLink client={client} />
        </li>
      ))}
    </ul>
  );
}
