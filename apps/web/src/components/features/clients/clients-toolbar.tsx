"use client";

import { clientSegmentLabels, clientTags, type ClientTag } from "@sijaf/shared";
import { FilterChips } from "@/components/ui/filter-chips";
import { UrlSearchField } from "@/components/ui/url-search-field";
import { useUrlParams } from "@/lib/use-url-params";

/** «عملاء جدد» و«متكررين» و«محتاج متابعة» بالترتيب اللي في التصميم */
const segments: ClientTag[] = ["new", "repeat", "followup"];

export function ClientsToolbar() {
  const { params, update } = useUrlParams();
  const current = params.get("segment");
  const segment = clientTags.find((value): value is ClientTag => value === current) ?? "all";
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <UrlSearchField placeholder="ابحث بالاسم أو رقم الموبايل..." className="lg:w-80" />
      <FilterChips
        label="تصفية العملاء"
        value={segment}
        onValueChange={(value) => update({ segment: value === "all" ? null : value })}
        options={[{ value: "all", label: "الكل" }, ...segments.map((value) => ({ value, label: clientSegmentLabels[value] }))]}
      />
    </div>
  );
}
