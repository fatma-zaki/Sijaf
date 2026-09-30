"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button } from "./button";
import { Dialog } from "./dialog";
import { FormError } from "./form-error";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel: string;
  /** بيرجّع رسالة خطأ لو فشل */
  onConfirm: () => Promise<string | null>;
};

/** تأكيد قبل الحذف أو أي فعل مايترجعش */
export function ConfirmDialog({ open, onOpenChange, title, description, children, confirmLabel, onConfirm }: ConfirmDialogProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const confirm = () =>
    startTransition(async () => {
      const message = await onConfirm();
      setError(message);
      if (!message) onOpenChange(false);
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
      title={title}
      description={description}
      className="w-120"
      footer={
        <>
          <Button variant="danger" onClick={confirm} disabled={pending}>
            {pending ? "لحظة..." : confirmLabel}
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </>
      }
    >
      {children}
      <FormError message={error ?? undefined} />
    </Dialog>
  );
}
