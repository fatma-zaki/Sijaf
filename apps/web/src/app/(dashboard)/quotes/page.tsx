import { quoteStatuses, type CatalogCountsDto, type QuoteListDto, type QuoteStatus } from "@sijaf/shared";
import { FileText, Plus, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { QuoteCards, QuotesTable } from "@/components/features/quotes/quotes-list";
import { QuotesToolbar } from "@/components/features/quotes/quotes-toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoNote } from "@/components/ui/info-note";
import { Pagination } from "@/components/ui/pagination";
import { apiRequest } from "@/lib/api/server";
import { requireQuoter } from "@/lib/auth/session";

export const metadata: Metadata = { title: "عروض الأسعار" };

const PAGE_SIZE = 10;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function NewQuoteLink({ label = "عرض سعر جديد" }: { label?: string }) {
  return (
    <Link href="/quotes/new" className={buttonStyles()}>
      {label}
      <Plus aria-hidden />
    </Link>
  );
}

export default async function QuotesPage({ searchParams }: PageProps<"/quotes">) {
  const { user } = await requireQuoter();
  const raw = await searchParams;
  const filters = new URLSearchParams();
  const q = first(raw.q)?.trim();
  if (q) filters.set("q", q);
  const status = quoteStatuses.find((value): value is QuoteStatus => value === first(raw.status));
  if (status) filters.set("status", status);
  const page = Math.max(1, Number(first(raw.page)) || 1);

  const query = new URLSearchParams(filters);
  query.set("page", String(page));
  query.set("pageSize", String(PAGE_SIZE));
  const list = await apiRequest<QuoteListDto>(`/quotes?${query}`);

  // لسه مفيش ولا عرض في المحل خالص
  if (list.counts.all === 0 && !q) {
    const catalog = user.role === "owner" ? await apiRequest<CatalogCountsDto>("/catalog/counts") : null;
    return (
      <>
        <PageHeader title="عروض الأسعار" />
        <Card className="flex grow flex-col">
          <EmptyState
            icon={<FileText aria-hidden />}
            title="لسه ماعملتش أي عرض سعر"
            description="صوّر الستارة أو ارفع صورة من العميل، وسِجاف يطلعلك 3 أسعار من كتالوج محلك في أقل من دقيقة."
            actions={<NewQuoteLink label="اعمل أول عرض سعر" />}
          >
            {catalog?.materials === 0 && (
              <InfoNote tone="warning" className="justify-center">
                كتالوج الأسعار لسه فاضي، فالعروض هتطلع من غير أسعار.{" "}
                <Link href="/catalog/materials" className="font-semibold text-link">
                  ضيف أسعارك الأول
                </Link>
              </InfoNote>
            )}
          </EmptyState>
        </Card>
      </>
    );
  }

  const pageHref = (target: number) => {
    const params = new URLSearchParams(filters);
    if (target > 1) params.set("page", String(target));
    return `/quotes${params.size ? `?${params}` : ""}`;
  };
  const shownTo = Math.min(page * PAGE_SIZE, list.total);

  return (
    <>
      <PageHeader
        title="عروض الأسعار"
        actions={
          <div className="hidden md:block">
            <NewQuoteLink />
          </div>
        }
      />
      <QuotesToolbar counts={list.counts} />
      {list.items.length > 0 ? (
        <>
          <Card className="hidden flex-col gap-0 p-0 md:flex">
            <QuotesTable quotes={list.items} />
            <Pagination
              className="border-t border-border"
              summary={`عرض ${shownTo} من ${list.total} عرض`}
              previousHref={page > 1 ? pageHref(page - 1) : undefined}
              nextHref={shownTo < list.total ? pageHref(page + 1) : undefined}
            />
          </Card>
          <div className="flex flex-col gap-2 md:hidden">
            <QuoteCards quotes={list.items} />
            <Pagination
              className="px-0"
              summary={`${shownTo} من ${list.total}`}
              previousHref={page > 1 ? pageHref(page - 1) : undefined}
              nextHref={shownTo < list.total ? pageHref(page + 1) : undefined}
            />
          </div>
        </>
      ) : (
        <Card>
          <EmptyState icon={<SearchX aria-hidden />} title="مفيش عروض بالبحث ده" description="جرّب اسم تاني أو رقم العرض، أو شيل فلتر الحالة." />
        </Card>
      )}
    </>
  );
}
