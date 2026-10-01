"use client";

import { quoteStatuses, quoteStatusLabels, type QuoteListDto, type QuoteStatus } from "@sijaf/shared";
import { FilterChips } from "@/components/ui/filter-chips";
import { UrlSearchField } from "@/components/ui/url-search-field";
import { useUrlParams } from "@/lib/use-url-params";

/** البحث بالاسم أو الموبايل أو رقم العرض، وفلتر الحالة (في الـ URL) */
export function QuotesToolbar({ counts }: { counts: QuoteListDto["counts"] }) {
  const { params, update } = useUrlParams();
  const current = params.get("status");
  const status = quoteStatuses.find((value): value is QuoteStatus => value === current) ?? "all";

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <UrlSearchField placeholder="ابحث باسم العميل أو رقم العرض..." className="lg:w-80" />
      <FilterChips
        label="تصفية حسب الحالة"
        value={status}
        onValueChange={(value) => update({ status: value === "all" ? null : value })}
        options={[
          { value: "all", label: "الكل", count: counts.all },
          // المرفوض بيظهر بس لو فيه عروض مرفوضة
          ...quoteStatuses
            .filter((value) => value !== "rejected" || counts.rejected > 0 || status === "rejected")
            .map((value) => ({ value, label: quoteStatusLabels[value], count: counts[value] })),
        ]}
      />
    </div>
  );
}
