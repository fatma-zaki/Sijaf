import { REPORTS_MIN_QUOTES, reportPeriodLabels, reportPeriods, type ReportPeriod, type ReportsDto } from "@sijaf/shared";
import { ChartColumn, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PeriodFilter } from "@/components/features/reports/period-filter";
import { MonthlyChart, ReportMetrics, SupplierPerformance, TierSplit, TopMaterials } from "@/components/features/reports/report-sections";
import { PageHeader } from "@/components/layout/page-header";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { apiRequest } from "@/lib/api/server";
import { requireOwner } from "@/lib/auth/session";

export const metadata: Metadata = { title: "التقارير" };

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  await requireOwner();
  const raw = (await searchParams).period;
  const period: ReportPeriod = reportPeriods.find((value) => value === raw) ?? "month";
  const report = await apiRequest<ReportsDto>(`/reports?period=${period}`);

  // التقارير بتبدأ بعد أول 5 عروض
  if (report.totalQuotes < REPORTS_MIN_QUOTES) {
    return (
      <>
        <PageHeader title="التقارير" backHref="/more" />
        <ReportMetrics report={null} />
        <Card className="flex grow flex-col">
          <EmptyState
            icon={<ChartColumn aria-hidden />}
            title={`التقارير بتبدأ بعد أول ${REPORTS_MIN_QUOTES} عروض`}
            description="هنا هتشوف عدد العروض كل شهر، ونسبة القبول، والخامات الأكثر طلبًا، وربحك من كل مورد."
            actions={
              <Link href="/quotes/new" className={buttonStyles()}>
                اعمل عرض سعر
                <Plus aria-hidden />
              </Link>
            }
          >
            <div className="flex flex-col gap-1.5">
              <span className="flex justify-between text-sm text-ink-2">
                <span>عروض الأسعار</span>
                <span>
                  {report.totalQuotes} من {REPORTS_MIN_QUOTES}
                </span>
              </span>
              <ProgressBar label="عروض الأسعار" value={report.totalQuotes} max={REPORTS_MIN_QUOTES} />
            </div>
          </EmptyState>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="التقارير" subtitle={<span className="md:hidden">{reportPeriodLabels[period]}</span>} backHref="/more" />
      <PeriodFilter value={period} />
      <ReportMetrics report={report} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-6">
        <MonthlyChart monthly={report.monthly} />
        <TopMaterials materials={report.topMaterials} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-6">
        <TierSplit counts={report.tiers} />
        <SupplierPerformance suppliers={report.suppliers} />
      </div>
    </>
  );
}
