"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** مبني على <dialog> الأصلي: الـ focus trap والـ Esc والـ backdrop من المتصفح */
export function Dialog({ open, onOpenChange, title, description, children, footer, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={() => onOpenChange(false)}
      onClick={(event) => {
        // الضغط على الخلفية بيقفل
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
      className={cn(
        "m-auto max-h-[calc(100dvh-32px)] w-160 max-w-[calc(100%-32px)] flex-col rounded-lg bg-surface p-0 text-ink-2 shadow-raised backdrop:bg-pine-900/45 open:flex",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-6 md:py-5">
        <div className="flex flex-col">
          <h2 id={titleId} className="m-0 text-xl font-bold text-ink">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="m-0 text-xs text-ink-muted">
              {description}
            </p>
          )}
        </div>
        <Button variant="ghost" iconOnly aria-label="إغلاق" onClick={() => onOpenChange(false)}>
          <X aria-hidden />
        </Button>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto px-4 py-5 md:px-6">{children}</div>
      {footer && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-4 md:px-6">{footer}</div>
      )}
    </dialog>
  );
}
