"use client";

import { operationLabels, pricingMethodShortLabels, type CurtainModelDto } from "@sijaf/shared";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeOnboardingStep } from "@/components/features/shop/actions";
import { Button, buttonStyles } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { FormError } from "@/components/ui/form-error";
import { formatCurrency, formatNumber } from "@/lib/format";

const columns: DataTableColumn<CurtainModelDto>[] = [
  { id: "name", header: "الموديل", cell: (m) => <span className="font-semibold text-ink">{m.name}</span> },
  { id: "method", header: "الحساب", cell: (m) => pricingMethodShortLabels[m.pricingMethod] },
  { id: "fullness", header: "الكشكشة", cell: (m) => (m.pricingMethod === "linear_fullness" ? `× ${formatNumber(m.fullness)}` : "—") },
  { id: "labor", header: "المصنعية", numeric: true, cell: (m) => formatCurrency(m.laborPerUnit) },
  { id: "operation", header: "التشغيل", cell: (m) => operationLabels[m.operation] },
  {
    id: "edit",
    header: <span className="sr-only">تعديل</span>,
    cell: (m) => (
      <Link href={`/catalog/models?model=${m.id}`} className="inline-flex min-h-11 items-center text-sm font-semibold">
        تعديل
      </Link>
    ),
  },
];

/** مراجعة سريعة للموديلات الجاهزة؛ التعديل التفصيلي في الكتالوج */
export function ModelsStep({ models }: { models: CurtainModelDto[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const confirm = () =>
    startTransition(async () => {
      const result = await completeOnboardingStep("models");
      if (!result.ok) return setError(result.message);
      router.push("/onboarding/team");
    });

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
        <DataTable label="الموديلات" columns={columns} rows={models} getRowKey={(m) => m.id} />
      </div>
      <FormError message={error} />
      <div className="mt-auto flex items-center justify-between gap-3">
        <Button size="lg" onClick={confirm} disabled={pending} className="min-w-45">
          {pending ? "لحظة..." : "تمام، كمّل"}
          <Check aria-hidden />
        </Button>
        <Link href="/onboarding/prices" className={buttonStyles({ variant: "ghost", size: "lg" })}>
          رجوع
        </Link>
      </div>
    </>
  );
}
