import { cn } from "@/lib/cn";

type ProgressBarProps = {
  value: number;
  max?: number;
  label: string;
  className?: string;
};

export function ProgressBar({ value, max = 100, label, className }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("h-2 overflow-hidden rounded-pill border border-border bg-surface-subtle", className)}
    >
      {/* العرض قيمة متغيرة، فلازم style */}
      <span className="block h-full rounded-pill bg-primary" style={{ width: `${percent}%` }} />
    </div>
  );
}
