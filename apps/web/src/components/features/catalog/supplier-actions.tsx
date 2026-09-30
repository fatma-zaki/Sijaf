"use client";

import { toWhatsAppNumber, type SupplierDto } from "@sijaf/shared";
import { FileSpreadsheet, MessageCircle, Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import { ExcelImportDialog } from "./excel/excel-import-dialog";
import { MaterialDialog, type SupplierOption } from "./material-dialog";
import { SupplierDialog } from "./supplier-dialog";

/** «تعديل البيانات» و«مراسلة على واتساب» في رأس صفحة المورد */
export function SupplierHeaderActions({ supplier }: { supplier: SupplierDto }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => setEditing(true)}>
        تعديل البيانات
        <Pencil aria-hidden />
      </Button>
      {supplier.whatsapp && (
        <a href={`https://wa.me/${toWhatsAppNumber(supplier.whatsapp)}`} target="_blank" rel="noreferrer" className={buttonStyles()}>
          مراسلة على واتساب
          <MessageCircle aria-hidden />
        </a>
      )}
      <SupplierDialog open={editing} onOpenChange={setEditing} supplier={supplier} />
    </div>
  );
}

/** «تحديث الأسعار من Excel» و«إضافة خامة» لخامات المورد */
export function SupplierMaterialActions({ supplier, suppliers }: { supplier: SupplierDto; suppliers: SupplierOption[] }) {
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const defaults = useMemo(() => ({ supplierId: supplier.id }), [supplier.id]);
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={() => setImporting(true)}>
        تحديث الأسعار من Excel
        <FileSpreadsheet aria-hidden />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
        إضافة خامة
        <Plus aria-hidden />
      </Button>
      <ExcelImportDialog
        open={importing}
        onOpenChange={setImporting}
        title={`تحديث أسعار ${supplier.name}`}
        fallbackSupplier={supplier.name}
      />
      <MaterialDialog open={adding} onOpenChange={setAdding} suppliers={suppliers} defaults={defaults} />
    </div>
  );
}
