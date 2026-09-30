"use client";

import { basisLabels, itemBases, type CurtainModelInput, type MaterialDto } from "@sijaf/shared";
import { Trash2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { InputWithUnit, Select } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/format";
import { withDefault } from "@/lib/forms";

export type ItemRow = { index: number; key: string; materialId: string | null; label: string };

type ModelItemsProps = {
  rows: ItemRow[];
  materials: Map<string, MaterialDto>;
  form: UseFormReturn<CurtainModelInput>;
  onRemove: (index: number) => void;
  emptyText: string;
};

const headerCell = "text-xs font-medium text-ink-muted";
// على حسب عرض القسم نفسه مش الشاشة: قسم الإكسسوارات أضيق من التشغيل على اللابتوب
const grid =
  "@min-[46rem]:grid @min-[46rem]:grid-cols-[minmax(160px,1fr)_170px_76px_112px_112px_40px] @min-[46rem]:items-center @min-[46rem]:gap-3";

/** بنود الموديل (تشغيل أو إكسسوارات): صف لكل بند، ويتحول لكارت على الموبايل */
export function ModelItems({ rows, materials, form, onRemove, emptyText }: ModelItemsProps) {
  const errors = form.formState.errors;
  if (rows.length === 0) return <p className="m-0 px-5 py-4 text-sm text-ink-muted">{emptyText}</p>;

  return (
    <div role="table" aria-label="بنود الموديل" className="@container flex flex-col">
      <div role="row" className={`hidden border-b border-border bg-surface-subtle px-5 py-2.5 ${grid}`}>
        <span role="columnheader" className={headerCell}>البند</span>
        <span role="columnheader" className={headerCell}>بيتحسب</span>
        <span role="columnheader" className={headerCell}>الكمية</span>
        <span role="columnheader" className={headerCell}>السعر</span>
        <span role="columnheader" className={headerCell}>في العرض</span>
        <span role="columnheader" className="sr-only">إزالة</span>
      </div>
      {rows.map((row) => {
        const material = row.materialId ? materials.get(row.materialId) : undefined;
        const itemErrors = errors.items?.[row.index];
        return (
          <div
            role="row"
            key={row.key}
            // ضيق: الاسم، وتحته الأساس والكمية والسعر، وتحتهم إجباري والحذف
            className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2 border-b border-border px-5 py-3 last:border-b-0 ${grid}`}
          >
            <span role="cell" className="col-span-3 flex flex-col @min-[46rem]:col-span-1">
              <span className="font-medium text-ink">{material?.name ?? row.label}</span>
              <span className="text-xs text-ink-muted">
                {material ? `من الكتالوج${material.supplierName ? ` · ${material.supplierName}` : ""}` : "سعر ثابت"}
              </span>
              {itemErrors?.label?.message && <span className="text-xs text-danger-fg">{itemErrors.label.message}</span>}
            </span>
            <span role="cell">
              <Select aria-label={`أساس حساب ${row.label}`} className="h-9" {...withDefault(form, `items.${row.index}.basis`)}>
                {itemBases.map((basis) => (
                  <option key={basis} value={basis}>
                    {basisLabels[basis]}
                  </option>
                ))}
              </Select>
            </span>
            <span role="cell" className="flex items-center gap-2 @min-[46rem]:block">
              <span className="text-xs text-ink-muted @min-[46rem]:hidden">الكمية</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                aria-label={`كمية ${row.label}`}
                aria-invalid={itemErrors?.quantity ? true : undefined}
                className="h-9 w-20 rounded-sm border border-border-strong bg-surface px-2 text-center text-ink aria-invalid:border-danger"
                {...withDefault(form, `items.${row.index}.quantity`)}
              />
            </span>
            <span role="cell" className="whitespace-nowrap font-semibold text-ink">
              {material ? (
                formatCurrency(material.sellPrice)
              ) : (
                <InputWithUnit
                  unit="ج.م"
                  inputMode="decimal"
                  aria-label={`سعر ${row.label}`}
                  className="h-9 pe-11"
                  wrapperClassName="w-28"
                  {...withDefault(form, `items.${row.index}.unitPrice`)}
                />
              )}
            </span>
            <span role="cell" className="col-span-2 @min-[46rem]:col-span-1">
              <Controller
                control={form.control}
                name={`items.${row.index}.isRequired`}
                render={({ field }) => (
                  <Switch
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                    label={field.value === false ? "اختياري" : "إجباري"}
                    aria-label={`${row.label} إجباري`}
                  />
                )}
              />
            </span>
            <span role="cell" className="justify-self-end @min-[46rem]:justify-self-auto">
              <Button variant="danger-ghost" size="sm" iconOnly aria-label={`إزالة ${row.label}`} onClick={() => onRemove(row.index)}>
                <Trash2 aria-hidden />
              </Button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
