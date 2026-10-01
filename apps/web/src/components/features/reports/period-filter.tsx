"use client";

import { reportPeriodLabels, reportPeriods, type ReportPeriod } from "@sijaf/shared";
import { FilterChips } from "@/components/ui/filter-chips";
import { useUrlParams } from "@/lib/use-url-params";

/** الفترة في الـ URL (?period=)، والشهر هو الافتراضي */
export function PeriodFilter({ value }: { value: ReportPeriod }) {
  const { update } = useUrlParams();
  return (
    <FilterChips
      label="الفترة"
      value={value}
      onValueChange={(next) => update({ period: next === "month" ? null : next })}
      options={reportPeriods.map((period) => ({ value: period, label: reportPeriodLabels[period] }))}
    />
  );
}
