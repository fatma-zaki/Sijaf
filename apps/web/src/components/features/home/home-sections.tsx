import type { AppointmentDto, DashboardDto } from "@sijaf/shared";
import { CalendarDays, ChevronLeft, CircleCheck, FileText, Plus, Sparkles, Sun } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { formatChange, formatCurrency, formatDimensions, formatRelativeDateTime, formatWeekdayDate } from "@/lib/format";
import { curtainTitle } from "../quotes/quote-format";
import { QuoteStatusBadge } from "../quotes/quote-status-badge";
import { QuoteCards } from "../quotes/quotes-list";
import { AppointmentCard, AppointmentDetails } from "../schedule/appointment-card";

type QuoteStats = NonNullable<DashboardDto["quotes"]>;
type RecentQuote = QuoteStats["recent"][number];

/** «صباح الخير» قبل الضهر و«مساء الخير» بعده (بتوقيت القاهرة) */
export function greeting(now: Date = new Date()): string {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", hour: "numeric", hourCycle: "h23" }).format(now));
  return hour >= 4 && hour < 12 ? "صباح الخير" : "مساء الخير";
}

/** «عرض سعر جديد» الكبير على التابلت واللابتوب */
export function QuoteHero() {
  return (
    <Card className="hidden items-center justify-between gap-4 px-6 md:flex">
      <div className="flex items-center gap-4">
        <span className="grid size-12 flex-none place-items-center rounded-md bg-primary-soft text-primary [&_svg]:size-6">
          <Sparkles aria-hidden />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-lg font-bold text-ink">حوّل صورة الستارة إلى عرض سعر في أقل من دقيقة</span>
          <span className="text-sm text-ink-muted">صوّر الشباك أو ارفع صورة من العميل، وأدخل المقاس، والسعر يُحسب من أسعار محلك.</span>
        </div>
      </div>
      <Link href="/quotes/new" className={buttonStyles({ size: "lg" })}>
        عرض سعر جديد
        <Plus aria-hidden />
      </Link>
    </Card>
  );
}

export function QuoteStatCards({ stats }: { stats: QuoteStats }) {
  const delta = (current: number, previous: number) => formatChange(current, previous) ?? undefined;
  return (
    <>
      <div className="hidden grid-cols-3 gap-4 md:grid lg:gap-6">
        <StatCard value={stats.month} label="إجمالي العروض هذا الشهر" delta={delta(stats.month, stats.lastMonth)} icon={<FileText aria-hidden />} />
        <StatCard value={stats.today} label="عروض اليوم" delta={delta(stats.today, stats.yesterday)} icon={<Sun aria-hidden />} />
        <StatCard
          value={stats.acceptedMonth}
          label="عروض قبلها العملاء"
          delta={delta(stats.acceptedMonth, stats.acceptedLastMonth)}
          icon={<CircleCheck aria-hidden />}
        />
      </div>
      {/* الموبايل: رقمين بس زي التصميم */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        <StatCard value={stats.today} label="عروض اليوم" className="p-4" />
        <StatCard value={stats.acceptedMonth} label="عروض مقبولة" className="p-4" />
      </div>
    </>
  );
}

const recentColumns: DataTableColumn<RecentQuote>[] = [
  {
    id: "client",
    header: "العميل",
    cell: (quote) => (
      <Link href={`/quotes/${quote.id}`} className="font-semibold text-ink">
        {quote.clientName}
      </Link>
    ),
  },
  { id: "curtain", header: "نوع الستارة", cell: (quote) => curtainTitle(quote.roomLabel, null) },
  {
    id: "size",
    header: "المقاس",
    visibleFrom: "lg",
    className: "whitespace-nowrap",
    cell: (quote) => (quote.widthCm && quote.heightCm ? formatDimensions(quote.widthCm, quote.heightCm) : "—"),
  },
  { id: "price", header: "السعر", numeric: true, cell: (quote) => (quote.tier ? formatCurrency(quote.total) : "—") },
  { id: "status", header: "الحالة", cell: (quote) => <QuoteStatusBadge status={quote.status} /> },
  { id: "date", header: "التاريخ", visibleFrom: "lg", className: "whitespace-nowrap", cell: (quote) => formatRelativeDateTime(new Date(quote.createdAt)) },
];

export function RecentQuotes({ quotes }: { quotes: RecentQuote[] }) {
  const header = (
    <div className="flex items-center justify-between">
      <CardTitle className="text-md md:text-lg">آخر عروض الأسعار</CardTitle>
      {quotes.length > 0 && (
        <Link href="/quotes" className="text-sm font-semibold">
          عرض الكل
        </Link>
      )}
    </div>
  );
  if (quotes.length === 0) {
    return (
      <Card className="flex flex-col">
        {header}
        <EmptyState
          icon={<FileText aria-hidden />}
          title="لسه مفيش عروض"
          description="أول ما تعمل عرض سعر هيظهر هنا، ومعاه حالته وهل العميل وافق."
          actions={
            <Link href="/quotes/new" className={buttonStyles()}>
              اعمل أول عرض
              <Plus aria-hidden />
            </Link>
          }
        />
      </Card>
    );
  }
  return (
    <>
      <Card className="hidden flex-col gap-0 p-0 md:flex">
        <div className="p-5 pb-4">{header}</div>
        <DataTable label="آخر عروض الأسعار" columns={recentColumns} rows={quotes} getRowKey={(quote) => quote.id} />
      </Card>
      <section aria-label="آخر العروض" className="flex flex-col gap-2.5 md:hidden">
        {header}
        <QuoteCards quotes={quotes.slice(0, 3)} />
      </section>
    </>
  );
}

/** «مواعيد اليوم» جنب آخر العروض */
export function TodayAppointments({ appointments, linkSchedule }: { appointments: AppointmentDto[]; linkSchedule: boolean }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-col">
        <CardTitle className="text-md md:text-lg">مواعيد اليوم</CardTitle>
        <span className="text-xs text-ink-muted">{formatWeekdayDate(new Date())}</span>
      </div>
      {appointments.length === 0 ? (
        <p className="m-0 flex items-center gap-2 py-3 text-sm text-ink-muted">
          <CalendarDays aria-hidden className="size-4" />
          مفيش مواعيد النهارده.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {appointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      )}
      {linkSchedule && (
        <Link href="/schedule" className={buttonStyles({ variant: "secondary", block: true, className: "mt-auto" })}>
          كل المواعيد
          <ChevronLeft aria-hidden />
        </Link>
      )}
    </Card>
  );
}

/** الموبايل: «الموعد الجاي» */
export function NextAppointment({ appointment }: { appointment: AppointmentDto }) {
  return (
    <section aria-label="الموعد الجاي" className="flex flex-col gap-2.5 md:hidden">
      <h2 className="m-0 text-md font-bold text-ink">الموعد الجاي</h2>
      <AppointmentDetails appointment={appointment} />
    </section>
  );
}
