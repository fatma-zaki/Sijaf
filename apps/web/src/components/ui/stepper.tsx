import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

type StepperProps = {
  steps: readonly string[];
  /** رقم الخطوة الحالية من 0 */
  current: number;
  label: string;
  /** لو الخطوات بتخلص بترتيب مختلف (زي تجهيز المحل)؛ غير كده اللي قبل الحالية تعتبر خلصت */
  completed?: readonly boolean[];
  className?: string;
};

/** على التابلت واللابتوب أرقام وأسماء، وعلى الموبايل شرايط بس */
export function Stepper({ steps, current, label, completed, className }: StepperProps) {
  return (
    <div className={className}>
      <ol aria-label={label} className="m-0 hidden list-none items-center gap-3 p-0 md:flex">
        {steps.map((step, index) => {
          const done = index !== current && (completed ? Boolean(completed[index]) : index < current);
          const isCurrent = index === current;
          const isLast = index === steps.length - 1;
          return (
            <li
              key={step}
              aria-current={isCurrent ? "step" : undefined}
              className={cn("flex items-center gap-2", isLast ? "flex-none" : "flex-1")}
            >
              <span
                className={cn(
                  "grid size-6.5 flex-none place-items-center rounded-pill border text-xs font-bold",
                  done || isCurrent
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border bg-surface-subtle text-ink-muted",
                )}
              >
                {done ? <Check aria-label="تمت" className="size-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-xs",
                  isCurrent ? "font-semibold text-ink" : "text-ink-muted",
                )}
              >
                {step}
              </span>
              {!isLast && (
                <span aria-hidden className={cn("h-px min-w-4 flex-1", done ? "bg-primary" : "bg-border")} />
              )}
            </li>
          );
        })}
      </ol>

      <div className="md:hidden">
        <p className="sr-only">
          {`${label}: خطوة ${current + 1} من ${steps.length} · ${steps[current]}`}
        </p>
        <div aria-hidden className="grid auto-cols-fr grid-flow-col gap-1.5">
          {steps.map((step, index) => (
            <span
              key={step}
              className={cn(
                "h-1 rounded-pill",
                index === current || (completed ? completed[index] : index < current) ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
