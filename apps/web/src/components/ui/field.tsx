import { cloneElement, isValidElement, useId, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const controlBase =
  "w-full rounded-sm border border-border-strong bg-surface px-3 text-base font-normal text-ink placeholder:text-ink-muted aria-invalid:border-danger disabled:opacity-60";

type ControlProps = { id?: string; "aria-describedby"?: string };

type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  className?: string;
  /** عنصر واحد (Input / Select / Textarea / InputWithUnit): بياخد id الـ label ورسالة الخطأ */
  children: ReactElement<ControlProps>;
};

/**
 * label مربوط بالـ control بـ htmlFor (مش لافف عليه)، عشان اسم الـ select
 * مايبقاش فيه نصوص كل الاختيارات، والـ hint أو الخطأ مربوطين بـ aria-describedby.
 */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const generatedId = useId();
  const control = isValidElement(children) ? children : null;
  const id = control?.props.id ?? generatedId;
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={cn("flex flex-col gap-1.5 text-sm font-medium text-ink-2", className)}>
      <label htmlFor={id}>{label}</label>
      {control
        ? cloneElement(control, {
            id,
            "aria-describedby": message ? cn(control.props["aria-describedby"], messageId) : control.props["aria-describedby"],
          })
        : children}
      {message && (
        <span id={messageId} role={error ? "alert" : undefined} className={cn("text-xs font-normal", error ? "text-danger-fg" : "text-ink-muted")}>
          {message}
        </span>
      )}
    </div>
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

type InputWithUnitProps = ComponentProps<"input"> & { unit: string; wrapperClassName?: string };

/** input وجنبه الوحدة جوه الحقل: «ج.م» أو «متر» أو «%» */
export function InputWithUnit({ unit, className, wrapperClassName, ...props }: InputWithUnitProps) {
  return (
    <span className={cn("relative block", wrapperClassName)}>
      <Input className={cn("pe-14", className)} {...props} />
      <span aria-hidden className="pointer-events-none absolute end-3 top-2.25 text-xs text-ink-muted">
        {unit}
      </span>
    </span>
  );
}
