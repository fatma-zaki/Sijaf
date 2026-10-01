import { clientTags, type ClientListDto, type ClientTag } from "@sijaf/shared";
import { Plus, SearchX, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AddClientButton } from "@/components/features/clients/add-client-button";
import { ClientCards, ClientsTable } from "@/components/features/clients/clients-list";
import { ClientsToolbar } from "@/components/features/clients/clients-toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { StatCard } from "@/components/ui/stat-card";
import { apiRequest } from "@/lib/api/server";
import { getSession } from "@/lib/auth/session";
import { formatChange } from "@/lib/format";

export const metadata: Metadata = { title: "العملاء" };

const PAGE_SIZE = 10;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  const { user } = await getSession();
  const raw = await searchParams;
  const filters = new URLSearchParams();
  const q = first(raw.q)?.trim();
  if (q) filters.set("q", q);
  const segment = clientTags.find((value): value is ClientTag => value === first(raw.segment));
  if (segment) filters.set("segment", segment);
  const page = Math.max(1, Number(first(raw.page)) || 1);

  const query = new URLSearchParams(filters);
  query.set("page", String(page));
  query.set("pageSize", String(PAGE_SIZE));
  const list = await apiRequest<ClientListDto>(`/clients?${query}`);
  const canAdd = user.canQuote;

  if (list.stats.total === 0) {
    return (
      <>
        <PageHeader title="العملاء" backHref="/more" />
        <Card className="flex grow flex-col">
          <EmptyState
            icon={<Users aria-hidden />}
            title="العملاء هيتضافوا لوحدهم"
            description="كل عميل بتعمله عرض سعر بيتسجل هنا باسمه ورقمه، ومعاه كل عروضه. تقدر كمان تضيف عملاءك القدام."
            actions={
              canAdd && (
                <>
                  <Link href="/quotes/new" className={buttonStyles()}>
                    اعمل أول عرض سعر
                    <Plus aria-hidden />
                  </Link>
                  <AddClientButton variant="secondary" />
                </>
              )
            }
          />
        </Card>
      </>
    );
  }

  const pageHref = (target: number) => {
    const params = new URLSearchParams(filters);
    if (target > 1) params.set("page", String(target));
    return `/clients${params.size ? `?${params}` : ""}`;
  };
  const shownTo = Math.min(page * PAGE_SIZE, list.total);
  const pagination = (className: string, summary: string) => (
    <Pagination
      className={className}
      summary={summary}
      previousHref={page > 1 ? pageHref(page - 1) : undefined}
      nextHref={shownTo < list.total ? pageHref(page + 1) : undefined}
    />
  );
  const { stats } = list;

  return (
    <>
      <PageHeader
        title="العملاء"
        subtitle={<span className="md:hidden">{stats.total} عميل</span>}
        backHref="/more"
        actions={canAdd && <AddClientButton label="إضافة" className="md:hidden" />}
      />
      <div className="hidden grid-cols-3 gap-4 md:grid lg:gap-6">
        <StatCard value={stats.total} label="إجمالي العملاء" delta={stats.newThisMonth > 0 ? `+${stats.newThisMonth}` : undefined} icon={<Users aria-hidden />} />
        <StatCard
          value={stats.newThisMonth}
          label="عملاء جدد هذا الشهر"
          delta={formatChange(stats.newThisMonth, stats.newLastMonth) ?? undefined}
          icon={<UserPlus aria-hidden />}
        />
        <StatCard value={`${stats.repeatPercent}%`} label="عملاء رجعوا لطلب تاني" icon={<Users aria-hidden />} />
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ClientsToolbar />
        {canAdd && <AddClientButton className="hidden md:inline-flex" />}
      </div>
      {list.items.length > 0 ? (
        <>
          <Card className="hidden flex-col gap-0 p-0 md:flex">
            <ClientsTable clients={list.items} linkQuotes={user.canQuote} />
            {pagination("border-t border-border", `عرض ${shownTo} من ${list.total} عميل`)}
          </Card>
          <div className="flex flex-col gap-2 md:hidden">
            <ClientCards clients={list.items} linkQuotes={user.canQuote} />
            {pagination("px-0", `${shownTo} من ${list.total}`)}
          </div>
        </>
      ) : (
        <Card>
          <EmptyState icon={<SearchX aria-hidden />} title="مفيش عملاء بالبحث ده" description="جرّب اسم تاني أو رقم الموبايل، أو شيل الفلتر." />
        </Card>
      )}
    </>
  );
}
