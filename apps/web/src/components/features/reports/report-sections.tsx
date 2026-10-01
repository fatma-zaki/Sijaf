import { STALE_PRICES_DAYS, tierLabels, tiers, type ReportsDto, type Tier } from "@sijaf/shared";
import { TriangleAlert } from "lucide-react";
import { BarChart } from "@/components/ui/bar-chart";
import { Card, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/cn";
import { daysAgo, formatCurrency, formatDaysAgo, formatMonthName, formatNumber } from "@/lib/format";
import { quotesCountText } from "../quotes/quote-format";

/** الكروت الأربعة فوق */
export function ReportMetrics({ report }: { report: ReportsDto | null }) {
  const dash = "—";
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
      <MetricCard label="قيمة العروض المرسلة" value={report ? formatCurrency(report.sent.value) : dash} hint={report ? quotesCountText(report.sent.count) : undefined} />
      <MetricCard
        label="قيمة العروض المقبولة"
        value={report ? formatCurrency(report.accepted.value) : dash}
        hint={report ? [quotesCountText(report.accepted.count), report.accepted.rate !== null ? `نسبة القبول ${report.accepted.rate}%` : null].filter(Boolean).join(" · ") : undefined}
      />
      <MetricCard label="الربح المتوقع" value={report ? formatCurrency(report.expectedProfit) : dash} hint={report ? "من فرق سعر الشراء والبيع" : undefined} />
      <MetricCard
        label="فرق السعر التقديري عن النهائي"
        value={report?.accuracy != null ? `${formatNumber(report.accuracy)}%` : dash}
        hint={report ? (report.accuracy != null ? "بعد المعاينة · دقة التسعير" : "اكتب السعر النهائي في صفحة العرض بعد المعاينة") : undefined}
      />
    </div>
  );
}

export function MonthlyChart({ monthly }: { monthly: ReportsDto["monthly"] }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <CardTitle className="text-md">عروض الأسعار كل شهر</CardTitle>
        <span className="text-xs text-ink-muted">آخر 6 شهور</span>
      </div>
      <BarChart
        label="عدد العروض"
        unit="عرض"
        data={monthly.map(({ month, count }) => ({ label: formatMonthName(new Date(`${month}-15T12:00:00Z`)), value: count }))}
      />
    </Card>
  );
}

export function TopMaterials({ materials }: { materials: ReportsDto["topMaterials"] }) {
  const max = Math.max(1, ...materials.map((m) => m.count));
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <CardTitle className="text-md">الخامات الأكثر طلبًا</CardTitle>
        <span className="text-xs text-ink-muted">عدد العروض</span>
      </div>
      {materials.length === 0 ? (
        <p className="m-0 text-sm text-ink-muted">مفيش عروض متسعّرة في الفترة دي.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {materials.map((material) => (
            <li key={material.name} className="flex flex-col gap-1">
              <span className="flex justify-between text-sm">
                <span className="text-ink">{material.name}</span>
                <span className="font-semibold text-ink">{material.count}</span>
              </span>
              <ProgressBar label={material.name} value={material.count} max={max} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const tierColors: Record<Tier, string> = { economy: "bg-primary-soft", standard: "bg-primary", premium: "bg-pine-900" };

export function TierSplit({ counts }: { counts: ReportsDto["tiers"] }) {
  const total = tiers.reduce((sum, tier) => sum + counts[tier], 0);
  const percent = (tier: Tier) => (total > 0 ? Math.round((counts[tier] / total) * 100) : 0);
  return (
    <Card className="flex flex-col gap-4">
      <CardTitle className="text-md">المستوى اللي العملاء بيختاروه</CardTitle>
      {total === 0 ? (
        <p className="m-0 text-sm text-ink-muted">مفيش عروض مقبولة في الفترة دي.</p>
      ) : (
        <>
          <div aria-hidden className="flex h-3 overflow-hidden rounded-pill bg-surface-subtle">
            {tiers.map((tier) => (
              // العرض قيمة متغيرة، فلازم style
              <span key={tier} className={tierColors[tier]} style={{ width: `${percent(tier)}%` }} />
            ))}
          </div>
          <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">
            {tiers.map((tier) => (
              <li key={tier} className="flex items-center gap-1.5 text-sm text-ink-2">
                <span aria-hidden className={cn("size-2.5 rounded-pill", tierColors[tier])} />
                {tierLabels[tier]} <b className="text-ink">{counts[tier]}</b> · {percent(tier)}%
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="m-0 text-xs text-ink-muted">من العروض المقبولة في الفترة دي.</p>
    </Card>
  );
}

type SupplierRow = ReportsDto["suppliers"][number];

const supplierColumns: DataTableColumn<SupplierRow>[] = [
  { id: "name", header: "المورد", cell: (row) => <span className="font-semibold text-ink">{row.name}</span> },
  { id: "count", header: "خامات مستخدمة", cell: (row) => `في ${quotesCountText(row.quoteCount)}` },
  { id: "purchase", header: "قيمة المشتريات", numeric: true, cell: (row) => formatCurrency(row.purchaseValue) },
  { id: "profit", header: "الربح", numeric: true, cell: (row) => formatCurrency(row.profit) },
  {
    id: "updated",
    header: "آخر تحديث أسعار",
    cell: (row) => {
      const date = new Date(row.pricesUpdatedAt);
      const stale = daysAgo(date) > STALE_PRICES_DAYS;
      return (
        <span className={cn("inline-flex items-center gap-1 whitespace-nowrap", stale && "font-semibold text-warning-fg")}>
          {stale && <TriangleAlert aria-label="الأسعار قديمة" className="size-3.5 text-warning" />}
          {formatDaysAgo(date)}
        </span>
      );
    },
  },
];

export function SupplierPerformance({ suppliers }: { suppliers: ReportsDto["suppliers"] }) {
  return (
    <Card className="flex flex-col gap-0 p-0">
      <div className="p-5 pb-3">
        <CardTitle className="text-md">أداء الموردين</CardTitle>
        <p className="m-0 text-xs text-ink-muted">المشتريات والربح من العروض المقبولة، بأسعار الشراء وقت العرض.</p>
      </div>
      {suppliers.length === 0 ? (
        <p className="m-0 px-5 pb-5 text-sm text-ink-muted">مفيش خامات من موردين في عروض الفترة دي.</p>
      ) : (
        <DataTable label="أداء الموردين" columns={supplierColumns} rows={suppliers} getRowKey={(row) => row.id} />
      )}
    </Card>
  );
}
