"use client";

import { pricingMethodShortLabels, type CurtainModelDto } from "@sijaf/shared";
import { Blinds, Gem, Plus, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonStyles } from "@/components/ui/button";
import { FilterChips } from "@/components/ui/filter-chips";
import { cn } from "@/lib/cn";

type OperationFilter = "all" | "manual" | "motorized";

type ModelListProps = { models: CurtainModelDto[]; selectedId: string | null };

/** قايمة الموديلات بتاجات (بالمتر الطولي، بريموت، إكسسوارات) */
export function ModelList({ models, selectedId }: ModelListProps) {
  const [filter, setFilter] = useState<OperationFilter>("all");
  const visible = filter === "all" ? models : models.filter((model) => model.operation === filter);

  return (
    <section aria-label="الموديلات" className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-lg font-bold text-ink">الموديلات</h2>
        <Link href="/catalog/models?model=new" scroll={false} className={buttonStyles({ size: "sm" })}>
          موديل جديد
          <Plus aria-hidden />
        </Link>
      </div>
      <FilterChips
        label="تصفية الموديلات"
        value={filter}
        onValueChange={setFilter}
        options={[
          { value: "all", label: "الكل" },
          { value: "manual", label: "يدوي" },
          { value: "motorized", label: "بريموت" },
        ]}
      />
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {visible.map((model) => {
          const selected = model.id === selectedId;
          const hasAccessories = model.items.some((item) => item.kind === "accessory");
          return (
            <li key={model.id}>
              <Link
                href={`/catalog/models?model=${model.id}`}
                scroll={false}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 no-underline",
                  selected ? "border-2 border-primary bg-primary-soft" : "border border-border bg-surface hover:bg-surface-subtle",
                )}
              >
                <span aria-hidden className="grid size-10 flex-none place-items-center rounded-sm border border-border bg-surface-subtle text-ink-muted">
                  <Blinds className="size-5" />
                </span>
                <span className="flex min-w-0 grow flex-col gap-1">
                  <span className="font-semibold text-ink">{model.name}</span>
                  <span className="flex flex-wrap items-center gap-1">
                    <span className="text-xs text-ink-2">{pricingMethodShortLabels[model.pricingMethod]}</span>
                    {model.operation === "motorized" && (
                      <span className="inline-flex h-5.5 items-center gap-1 rounded-pill bg-info-soft px-2 text-2xs font-semibold text-info">
                        <Zap aria-hidden className="size-3" />
                        بريموت
                      </span>
                    )}
                    {hasAccessories && (
                      <span className="inline-flex h-5.5 items-center gap-1 rounded-pill border border-border bg-surface-subtle px-2 text-2xs font-semibold text-ink-2">
                        <Gem aria-hidden className="size-3" />
                        إكسسوارات
                      </span>
                    )}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
