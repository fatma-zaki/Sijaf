"use client";

import { arabicKey, toWhatsAppNumber, type SupplierDto } from "@sijaf/shared";
import { MessageCircle, Plus, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import { SupplierDialog } from "./supplier-dialog";
import { pricesAge } from "./supplier-format";

function materialsCountText(count: number): string {
  if (count === 0) return "من غير خامات";
  if (count === 1) return "خامة واحدة";
  if (count === 2) return "خامتين";
  return `${count} ${count <= 10 ? "خامات" : "خامة"}`;
}

type SupplierListProps = { suppliers: SupplierDto[]; selectedId: string | null };

/** قايمة الموردين: البحث محلي لأن العدد صغير */
export function SupplierList({ suppliers, selectedId }: SupplierListProps) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const key = arabicKey(query);
  const visible = key ? suppliers.filter((s) => arabicKey(`${s.name} ${s.specialty}`).includes(key)) : suppliers;

  return (
    <section aria-label="الموردين" className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-lg font-bold text-ink">الموردين</h2>
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
          إضافة مورد
          <Plus aria-hidden />
        </Button>
      </div>
      <SearchField placeholder="ابحث عن مورد..." value={query} onChange={(event) => setQuery(event.target.value)} />
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {visible.map((supplier) => {
          const age = pricesAge(supplier);
          const selected = supplier.id === selectedId;
          return (
            <li key={supplier.id} className="flex items-stretch gap-2">
              <Link
                href={`/catalog/suppliers?supplier=${supplier.id}`}
                scroll={false}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "flex grow flex-col gap-1 rounded-md px-4 py-3.5 no-underline",
                  selected ? "border-2 border-primary bg-primary-soft" : "border border-border bg-surface hover:bg-surface-subtle",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-md font-semibold text-ink">{supplier.name}</span>
                  <span className="whitespace-nowrap text-xs font-semibold text-ink-2">{materialsCountText(supplier.materialsCount)}</span>
                </span>
                {(supplier.specialty || supplier.address) && (
                  <span className="text-xs text-ink-2">{[supplier.specialty, supplier.address].filter(Boolean).join(" · ")}</span>
                )}
                {age.stale && (
                  <span>
                    <StatusBadge tone="warning" icon={<TriangleAlert aria-hidden />}>
                      أسعار عمرها {age.days} يوم
                    </StatusBadge>
                  </span>
                )}
              </Link>
              {supplier.whatsapp && (
                <a
                  href={`https://wa.me/${toWhatsAppNumber(supplier.whatsapp)}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`واتساب ${supplier.name}`}
                  className="grid w-11 flex-none place-items-center rounded-md text-success hover:bg-success-soft md:hidden"
                >
                  <MessageCircle aria-hidden className="size-5" />
                </a>
              )}
            </li>
          );
        })}
      </ul>
      {visible.length === 0 && <p className="m-0 text-center text-sm text-ink-muted">مفيش مورد بالاسم ده</p>}
      <SupplierDialog open={adding} onOpenChange={setAdding} />
    </section>
  );
}
