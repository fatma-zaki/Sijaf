import { formatEgyptianMobile, type MaterialDto, type SupplierDto } from "@sijaf/shared";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDaysAgo } from "@/lib/format";
import { MaterialsView } from "./materials-view";
import type { SupplierOption } from "./material-dialog";
import { SupplierHeaderActions, SupplierMaterialActions } from "./supplier-actions";
import { leadTimeText, paymentText, supplierInitials } from "./supplier-format";

function average(values: number[]): number | null {
  return values.length === 0 ? null : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

type SupplierDetailProps = { supplier: SupplierDto; materials: MaterialDto[]; suppliers: SupplierOption[] };

/** بيانات المورد وإحصائياته وخاماته (Suppliers) */
export function SupplierDetail({ supplier, materials, suppliers }: SupplierDetailProps) {
  const info = [
    { label: "المسؤول", value: supplier.contactName || "—" },
    {
      label: "واتساب",
      value: supplier.whatsapp ? <span dir="ltr">{formatEgyptianMobile(supplier.whatsapp)}</span> : "—",
    },
    { label: "العنوان", value: supplier.address || "—" },
    { label: "طريقة الدفع", value: paymentText(supplier) },
    { label: "مدة التوريد", value: leadTimeText(supplier) },
  ];
  const avgSell = average(materials.map((m) => m.sellPrice));
  const avgPurchase = average(materials.flatMap((m) => (m.purchasePrice === null ? [] : [m.purchasePrice])));
  const stats = [
    { value: String(materials.length), label: "خامات في الكتالوج" },
    { value: avgSell === null ? "—" : formatCurrency(avgSell), label: "متوسط سعر البيع للمتر" },
    { value: avgPurchase === null ? "—" : formatCurrency(avgPurchase), label: "متوسط سعر الشراء للمتر" },
  ];

  return (
    <section aria-label={supplier.name} className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <Link href="/catalog/suppliers" className="inline-flex min-h-11 items-center gap-1 px-4 pt-2 text-sm font-semibold md:hidden">
        <ChevronRight aria-hidden className="size-4" />
        كل الموردين
      </Link>
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3.5">
          <span aria-hidden className="grid size-13 flex-none place-items-center rounded-md bg-pine-900 text-lg font-bold text-on-pine">
            {supplierInitials(supplier.name)}
          </span>
          <div className="flex flex-col">
            <h2 className="m-0 text-2xl font-bold text-ink">{supplier.name}</h2>
            <span className="text-xs text-ink-muted">
              {[supplier.specialty, `آخر تحديث للأسعار ${formatDaysAgo(new Date(supplier.pricesUpdatedAt))}`].filter(Boolean).join(" · ")}
            </span>
          </div>
        </div>
        <SupplierHeaderActions supplier={supplier} />
      </div>

      <dl className="m-0 grid grid-cols-2 gap-4 border-b border-border px-5 pb-5 md:grid-cols-5">
        {info.map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-ink-muted">{item.label}</dt>
            <dd className="m-0 text-base font-semibold text-ink">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-md border border-border bg-surface-subtle px-4 py-3">
            <div className="text-2xl font-bold text-ink">{stat.value}</div>
            <div className="text-xs text-ink-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-3">
        <h3 className="m-0 text-md font-bold text-ink">خامات المورد</h3>
        <SupplierMaterialActions supplier={supplier} suppliers={suppliers} />
      </div>
      {materials.length > 0 ? (
        <MaterialsView items={materials} suppliers={suppliers} hideSupplier />
      ) : (
        <p className="m-0 px-5 pb-5 text-sm text-ink-muted">لسه مفيش خامات مربوطة بالمورد ده.</p>
      )}
    </section>
  );
}
