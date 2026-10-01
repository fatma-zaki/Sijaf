import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  /** سطر صغير تحت الرقم: «24 عرض سعر» */
  hint?: ReactNode;
  className?: string;
};

/** رقم واحد بعنوان وشرح (كروت التقارير) */
export function MetricCard({ label, value, hint, className }: MetricCardProps) {
  return (
    <div className={cn("flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 shadow-card md:p-5", className)}>
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-2xl font-bold text-ink md:text-3xl">{value}</span>
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </div>
  );
}
