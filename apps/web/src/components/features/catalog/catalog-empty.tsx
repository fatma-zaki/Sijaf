"use client";

import { ChevronLeft, FileSpreadsheet, ListChecks, PencilLine, Plus, Tag } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormError } from "@/components/ui/form-error";
import { StatusBadge } from "@/components/ui/status-badge";
import { ExcelImportDialog } from "./excel/excel-import-dialog";
import { TemplateDownload } from "./excel/template-download";
import { MaterialDialog, type SupplierOption } from "./material-dialog";
import { useApplyTemplate } from "./use-apply-template";

type OptionProps = { icon: ReactNode; title: ReactNode; description: string; action: ReactNode };

function Option({ icon, title, description, action }: OptionProps) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-border bg-surface p-4.5 text-start">
      <span className="grid size-10 place-items-center rounded-sm bg-surface-subtle text-ink-2 [&_svg]:size-5">{icon}</span>
      <span className="flex items-center gap-2 text-md font-bold text-ink">{title}</span>
      <span className="grow text-sm text-ink-2">{description}</span>
      {action}
    </div>
  );
}

/** الكتالوج فاضي: 3 طرق لإضافة الأسعار (Catalog-Empty) */
export function CatalogEmpty({ suppliers }: { suppliers: SupplierOption[] }) {
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const template = useApplyTemplate();

  return (
    <Card className="flex flex-col items-center gap-6 p-0 pb-8">
      <EmptyState
        icon={<Tag aria-hidden />}
        title="ضيف أسعار محلك"
        description="كل خامة بسعر الشراء والبيع والمورد بتاعها. من غيرها سِجاف مايقدرش يحسب العروض."
        className="pb-0"
      />
      <div className="grid w-full max-w-240 grid-cols-1 gap-4 px-4 md:grid-cols-3">
        <Option
          icon={<FileSpreadsheet aria-hidden />}
          title={
            <>
              استيراد من Excel <StatusBadge tone="brand">الأسرع</StatusBadge>
            </>
          }
          description="عندك الأسعار في شيت؟ ارفعه ونرتب الأعمدة تلقائي."
          action={
            <Button onClick={() => setImporting(true)}>
              ارفع الشيت
              <ChevronLeft aria-hidden />
            </Button>
          }
        />
        <Option
          icon={<ListChecks aria-hidden />}
          title="ابدأ بأسعار نموذجية"
          description="25 خامة جاهزة بأشهر الأقمشة والمجاري، عدّل أسعارها لأسعارك."
          action={
            <Button variant="secondary" onClick={template.apply} disabled={template.pending}>
              {template.pending ? "بنضيف الخامات..." : "استخدم القائمة الجاهزة"}
            </Button>
          }
        />
        <Option
          icon={<PencilLine aria-hidden />}
          title="إدخال يدوي"
          description="ضيف الخامات واحدة واحدة. مناسب لو عندك أصناف قليلة."
          action={
            <Button variant="secondary" onClick={() => setAdding(true)}>
              إضافة خامة
              <Plus aria-hidden />
            </Button>
          }
        />
      </div>
      <FormError message={template.error ?? undefined} className="mx-4" />
      <TemplateDownload />
      <ExcelImportDialog open={importing} onOpenChange={setImporting} />
      <MaterialDialog open={adding} onOpenChange={setAdding} suppliers={suppliers} />
    </Card>
  );
}
