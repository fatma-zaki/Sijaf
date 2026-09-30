"use client";

import type { MaterialListDto } from "@sijaf/shared";
import Link from "next/link";
import { useUrlParams } from "@/lib/use-url-params";

type SupplierFilterProps = { suppliers: MaterialListDto["facets"]["suppliers"] };

/** كل الموردين متعلّمين افتراضيًا؛ شيل العلامة عشان تخفي خامات مورد */
export function SupplierFilter({ suppliers }: SupplierFilterProps) {
  const { params, update, pending } = useUrlParams();
  const selected = params.get("suppliers")?.split(",") ?? null;
  const isChecked = (id: string) => selected === null || selected.includes(id);

  const toggle = (id: string, checked: boolean) => {
    const current = selected ?? suppliers.map((supplier) => supplier.id);
    const next = checked ? [...current, id] : current.filter((value) => value !== id);
    // لو كله متعلّم يبقى مفيش فلتر
    update({ suppliers: next.length === suppliers.length ? null : next.join(",") || "none" });
  };

  if (suppliers.length === 0) return null;

  return (
    <fieldset
      aria-busy={pending}
      className="m-0 flex min-w-0 flex-col gap-0.5 rounded-lg border border-border bg-surface px-3 py-4 shadow-card"
    >
      <div className="flex items-center justify-between px-3 pb-2">
        <legend className="float-start p-0 text-md font-bold text-ink">المورد</legend>
        <Link href="/catalog/suppliers" className="text-sm font-semibold">
          إدارة الموردين
        </Link>
      </div>
      {suppliers.map((supplier) => (
        <label key={supplier.id} className="flex min-h-11 cursor-pointer items-center gap-2.5 px-3 text-base text-ink-2">
          <input
            type="checkbox"
            checked={isChecked(supplier.id)}
            onChange={(event) => toggle(supplier.id, event.target.checked)}
            className="size-4.5 flex-none accent-primary"
          />
          <span className="grow">{supplier.name}</span>
          <span className="text-xs text-ink-muted">{supplier.count}</span>
        </label>
      ))}
    </fieldset>
  );
}
