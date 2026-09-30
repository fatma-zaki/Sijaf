"use client";

import { CircleCheck, FileSpreadsheet, Plus, Truck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ExcelImportDialog } from "./excel/excel-import-dialog";
import { SupplierDialog } from "./supplier-dialog";

const benefits = ["كل خامة مربوطة بموردها", "تعرف ربحك من كل مورد", "تكلمه على واتساب بضغطة"];

/** مفيش موردين (Suppliers-Empty) */
export function SuppliersEmpty() {
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  return (
    <Card className="p-0">
      <EmptyState
        icon={<Truck aria-hidden />}
        title="لسه مفيش موردين"
        description="ضيف الموردين اللي بتشتري منهم، وبعدها اربط كل خامة بموردها."
        actions={
          <>
            <Button size="lg" onClick={() => setAdding(true)}>
              إضافة مورد
              <Plus aria-hidden />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setImporting(true)}>
              استيراد من Excel
              <FileSpreadsheet aria-hidden />
            </Button>
          </>
        }
      >
        <ul className="m-0 flex list-none flex-wrap justify-center gap-x-6 gap-y-2 p-0 text-sm text-ink-2">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-1.5">
              <CircleCheck aria-hidden className="size-4 text-success" />
              {benefit}
            </li>
          ))}
        </ul>
      </EmptyState>
      <SupplierDialog open={adding} onOpenChange={setAdding} />
      <ExcelImportDialog open={importing} onOpenChange={setImporting} />
    </Card>
  );
}
