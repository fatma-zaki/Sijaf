"use client";

import { ChevronLeft, FileSpreadsheet, ListChecks, PencilLine, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExcelImport } from "@/components/features/catalog/excel/excel-import";
import { MaterialDialog } from "@/components/features/catalog/material-dialog";
import { useApplyTemplate } from "@/components/features/catalog/use-apply-template";
import { Button, buttonStyles } from "@/components/ui/button";
import { ChoiceCard } from "@/components/ui/choice-card";
import { FormError } from "@/components/ui/form-error";
import { InfoNote } from "@/components/ui/info-note";
import { StatusBadge } from "@/components/ui/status-badge";

type PriceMethod = "excel" | "manual" | "template";

const NEXT_STEP = "/onboarding/models";

export function PricesStep({ materialsCount }: { materialsCount: number }) {
  const router = useRouter();
  const [method, setMethod] = useState<PriceMethod>(materialsCount > 0 ? "manual" : "excel");
  const [adding, setAdding] = useState(false);
  const template = useApplyTemplate(() => router.push(NEXT_STEP));

  return (
    <>
      {materialsCount > 0 && (
        <InfoNote tone="success">عندك {materialsCount} خامة في الكتالوج. تقدر تضيف كمان أو تكمّل.</InfoNote>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:gap-4">
        <ChoiceCard
          icon={<FileSpreadsheet aria-hidden />}
          title="استيراد من Excel"
          badge={<StatusBadge tone="brand">الأسرع</StatusBadge>}
          description="عندك الأسعار في شيت؟ ارفعه وإحنا نرتب الأعمدة."
          selected={method === "excel"}
          onSelect={() => setMethod("excel")}
        />
        <ChoiceCard
          icon={<PencilLine aria-hidden />}
          title="إدخال يدوي"
          description="ضيف الخامات واحدة واحدة بسعر الشراء والبيع."
          selected={method === "manual"}
          onSelect={() => setMethod("manual")}
        />
        {materialsCount === 0 && (
          <ChoiceCard
            icon={<ListChecks aria-hidden />}
            title="ابدأ بأسعار نموذجية"
            description="قائمة جاهزة بأشهر الخامات، وعدّل أسعارها لأسعارك."
            selected={method === "template"}
            onSelect={() => setMethod("template")}
          />
        )}
      </div>

      {method === "excel" && <ExcelImport />}
      {method === "manual" && (
        <div>
          <Button size="lg" onClick={() => setAdding(true)}>
            إضافة خامة
            <Plus aria-hidden />
          </Button>
          <MaterialDialog open={adding} onOpenChange={setAdding} suppliers={[]} />
        </div>
      )}
      {method === "template" && (
        <div className="flex flex-col gap-3">
          <InfoNote>
            هنضيف 5 موردين و31 خامة (شيفون، قطيفة، كتان، ساتان، جاكار، بلاك أوت، بطانات، مجاري، وموتورات وإكسسوارات) بأسعار
            نموذجية، وبعدها عدّلها لأسعارك من الكتالوج.
          </InfoNote>
          <FormError message={template.error ?? undefined} />
          <div>
            <Button size="lg" onClick={template.apply} disabled={template.pending}>
              {template.pending ? "بنضيف الخامات..." : "استخدم القائمة الجاهزة"}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3">
        <Link href={NEXT_STEP} className={buttonStyles({ size: "lg", variant: materialsCount > 0 ? "primary" : "secondary", className: "min-w-45" })}>
          {materialsCount > 0 ? "متابعة" : "تخطي دلوقتي"}
          <ChevronLeft aria-hidden />
        </Link>
        <Link href="/onboarding/shop" className={buttonStyles({ variant: "ghost", size: "lg" })}>
          رجوع
        </Link>
      </div>
    </>
  );
}
