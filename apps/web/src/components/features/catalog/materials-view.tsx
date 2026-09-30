"use client";

import { tierLabels, type MaterialDto } from "@sijaf/shared";
import { Pencil, SwatchBook, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/format";
import { deleteMaterial } from "./actions";
import { MarginLabel, TierLabel, materialKind } from "./labels";
import { MaterialDialog, type SupplierOption } from "./material-dialog";

type MaterialsViewProps = {
  items: MaterialDto[];
  suppliers: SupplierOption[];
  /** في صفحة المورد مش محتاجين عمود المورد */
  hideSupplier?: boolean;
};

/** جدول الخامات (تابلت ولابتوب) وكروت (موبايل)، ومعاهم التعديل والحذف */
export function MaterialsView({ items, suppliers, hideSupplier = false }: MaterialsViewProps) {
  const [editing, setEditing] = useState<MaterialDto | undefined>();
  const [deleting, setDeleting] = useState<MaterialDto | undefined>();

  const columns: DataTableColumn<MaterialDto>[] = [
    {
      id: "name",
      header: "الخامة",
      cell: (m) => (
        <span className="inline-flex items-center gap-2.5">
          <span className="grid size-8 flex-none place-items-center rounded-sm border border-border bg-surface-subtle text-ink-muted">
            <SwatchBook aria-hidden className="size-4" />
          </span>
          <span className="font-semibold text-ink">{m.name}</span>
        </span>
      ),
    },
    { id: "kind", header: "النوع", cell: materialKind },
    { id: "tier", header: "المستوى", cell: (m) => <TierLabel tier={m.tier} /> },
    ...(hideSupplier
      ? []
      : [
          {
            id: "supplier",
            header: "المورد",
            cell: (m: MaterialDto) =>
              m.supplierId ? (
                <Link href={`/catalog/suppliers?supplier=${m.supplierId}`} className="font-medium">
                  {m.supplierName}
                </Link>
              ) : (
                <span className="text-ink-muted">—</span>
              ),
          },
        ]),
    {
      id: "purchase",
      header: "سعر الشراء",
      numeric: true,
      cell: (m) => (m.purchasePrice === null ? <span className="font-normal text-ink-muted">—</span> : formatCurrency(m.purchasePrice)),
    },
    { id: "sell", header: "سعر البيع", numeric: true, cell: (m) => formatCurrency(m.sellPrice) },
    { id: "margin", header: "هامش الربح", cell: (m) => <MarginLabel purchasePrice={m.purchasePrice} sellPrice={m.sellPrice} stacked /> },
    {
      id: "actions",
      header: <span className="sr-only">إجراءات</span>,
      cell: (m) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" iconOnly aria-label={`تعديل ${m.name}`} onClick={() => setEditing(m)}>
            <Pencil aria-hidden />
          </Button>
          <Button variant="danger-ghost" size="sm" iconOnly aria-label={`حذف ${m.name}`} onClick={() => setDeleting(m)}>
            <Trash2 aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable label="الخامات" columns={columns} rows={items} getRowKey={(m) => m.id} className="hidden md:block" />

      <ul className="m-0 flex list-none flex-col gap-2.5 p-3 md:hidden">
        {items.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => setEditing(m)}
              className="flex w-full cursor-pointer flex-col gap-2.5 rounded-lg border border-border bg-surface p-3.5 text-start shadow-card"
            >
              <span className="flex items-start justify-between gap-2">
                <span className="flex flex-col">
                  <span className="text-md font-semibold text-ink">{m.name}</span>
                  <span className="text-xs text-ink-muted">{m.supplierName ?? materialKind(m)}</span>
                </span>
                <span className="rounded-pill bg-surface-subtle px-2.5 text-xs font-semibold text-ink-2">{tierLabels[m.tier]}</span>
              </span>
              <span className="grid grid-cols-3 gap-2 text-xs">
                <span className="flex flex-col">
                  <span className="text-ink-muted">الشراء</span>
                  <span className="text-sm font-semibold text-ink">{m.purchasePrice === null ? "—" : formatCurrency(m.purchasePrice)}</span>
                </span>
                <span className="flex flex-col">
                  <span className="text-ink-muted">البيع</span>
                  <span className="text-sm font-semibold text-ink">{formatCurrency(m.sellPrice)}</span>
                </span>
                <span className="flex flex-col">
                  <span className="text-ink-muted">الهامش</span>
                  <MarginLabel purchasePrice={m.purchasePrice} sellPrice={m.sellPrice} stacked />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <MaterialDialog open={editing !== undefined} onOpenChange={(open) => !open && setEditing(undefined)} suppliers={suppliers} material={editing} />
      <ConfirmDialog
        open={deleting !== undefined}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title={`حذف «${deleting?.name ?? ""}»؟`}
        description="هتختفي من الكتالوج ومن الاختيارات في العروض الجديدة. العروض القديمة مش هتتأثر."
        confirmLabel="حذف الخامة"
        onConfirm={async () => {
          if (!deleting) return null;
          const result = await deleteMaterial(deleting.id);
          return result.ok ? null : result.message;
        }}
      />
    </>
  );
}
