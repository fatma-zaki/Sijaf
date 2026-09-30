"use client";

import { Dialog } from "@/components/ui/dialog";
import { ExcelImport } from "./excel-import";

type ExcelImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  fallbackSupplier?: string | null;
};

export function ExcelImportDialog({ open, onOpenChange, title = "استيراد من Excel", fallbackSupplier }: ExcelImportDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="الخامات الموجودة بتتحدث أسعارها، والجديدة بتتضاف"
      className="w-190"
    >
      {/* بيترسم من جديد مع كل فتح عشان الاستيراد يبدأ من الأول */}
      {open && <ExcelImport fallbackSupplier={fallbackSupplier} />}
    </Dialog>
  );
}
