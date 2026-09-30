import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const controlBase =
  "w-full rounded-sm border border-border-strong bg-surface px-3 text-base font-normal text-ink placeholder:text-ink-muted aria-invalid:border-danger disabled:opacity-60";

type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
};

/** label حقيقي بيلف الـ control، ومعاه hint أو رسالة خطأ */
export function Field({ label, hint, error, className, children }: FieldProps) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm font-medium text-ink-2", className)}>
      <span>{label}</span>
      {children}
      {error ? (
        <span role="alert" className="text-xs font-normal text-danger-fg">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs font-normal text-ink-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlBase, "h-10", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(controlBase, "h-10 cursor-pointer", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlBase, "min-h-16 py-2", className)} {...props} />;
}

type InputWithUnitProps = ComponentProps<"input"> & { unit: string };

/** input وجنبه الوحدة جوه الحقل: «ج.م» أو «متر» أو «%» */
export function InputWithUnit({ unit, className, ...props }: InputWithUnitProps) {
  return (
    <span className="relative block">
      <Input className={cn("pe-14", className)} {...props} />
      <span className="pointer-events-none absolute end-3 top-2.25 text-xs text-ink-muted">{unit}</span>
    </span>
  );
}
