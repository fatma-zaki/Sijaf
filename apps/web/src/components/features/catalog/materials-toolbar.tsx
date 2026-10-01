"use client";

import { layerLabels, materialLayers, tierLabels, tiers, type MaterialLayer, type MaterialListDto, type Tier } from "@sijaf/shared";
import { FileSpreadsheet, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FilterChips } from "@/components/ui/filter-chips";
import { UrlSearchField } from "@/components/ui/url-search-field";
import { useUrlParams } from "@/lib/use-url-params";
import { ExcelImportDialog } from "./excel/excel-import-dialog";
import { MaterialDialog, type SupplierOption } from "./material-dialog";

/** البحث وأزرار الإضافة والاستيراد */
export function MaterialsToolbar({ suppliers }: { suppliers: SupplierOption[] }) {
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <UrlSearchField placeholder="ابحث باسم الخامة أو المورد..." className="md:w-80" />
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setImporting(true)} className="flex-1 md:flex-none">
          استيراد من Excel
          <FileSpreadsheet aria-hidden />
        </Button>
        <Button onClick={() => setAdding(true)} className="flex-1 md:flex-none">
          إضافة خامة
          <Plus aria-hidden />
        </Button>
      </div>
      <MaterialDialog open={adding} onOpenChange={setAdding} suppliers={suppliers} />
      <ExcelImportDialog open={importing} onOpenChange={setImporting} />
    </div>
  );
}

/** المستوى، والطبقة كمان على التابلت والموبايل (على اللابتوب الطبقة في الجنب) */
export function MaterialsFilterChips({ facets }: { facets: MaterialListDto["facets"] }) {
  const { params, update } = useUrlParams();
  const tier = (params.get("tier") as Tier | null) ?? "all";
  const layer = (params.get("layer") as MaterialLayer | null) ?? "all";

  return (
    <div className="flex flex-col gap-3">
      <FilterChips
        label="تصفية حسب الطبقة"
        className="lg:hidden"
        value={layer}
        onValueChange={(value) => update({ layer: value === "all" ? null : value })}
        options={[
          { value: "all", label: "الكل", count: facets.all },
          ...materialLayers
            .filter((value) => facets.layers[value] > 0 || value === layer)
            .map((value) => ({ value, label: layerLabels[value], count: facets.layers[value] })),
        ]}
      />
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-ink-muted">المستوى</span>
        <FilterChips
          label="تصفية حسب المستوى"
          value={tier}
          onValueChange={(value) => update({ tier: value === "all" ? null : value })}
          options={[{ value: "all", label: "الكل" }, ...tiers.map((value) => ({ value, label: tierLabels[value] }))]}
        />
      </div>
    </div>
  );
}
