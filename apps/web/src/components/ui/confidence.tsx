import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format";

/** أقل من كده بيظهر «ثقة ضعيفة · راجعها» */
export const LOW_CONFIDENCE = 70;

export function isLowConfidence(percent: number): boolean {
  return percent < LOW_CONFIDENCE;
}

/** نسبة الثقة كـ pill: «88%» */
export function ConfidenceBadge({ value, className }: { value: number; className?: string }) {
  const low = isLowConfidence(value);
  return (
    <span
      dir="ltr"
      aria-label={`الثقة ${formatPercent(value)}`}
      className={cn(
        "inline-flex h-5.5 min-w-11 items-center justify-center rounded-pill border px-2 text-xs font-semibold",
        low ? "border-transparent bg-warning-soft text-warning-fg" : "border-border bg-surface-subtle text-ink-2",
        className,
      )}
    >
      {formatPercent(value)}
    </span>
  );
}

type ConfidenceMeterProps = {
  icon: ReactNode;
  label: string;
  value: number;
};

/** صف فيه أيقونة واسم وشريط ونسبة */
export function ConfidenceMeter({ icon, label, value }: ConfidenceMeterProps) {
  return (
    <div className="grid grid-cols-[20px_1fr_2fr_44px] items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0">
      <span className="text-ink-muted [&_svg]:size-4">{icon}</span>
      <span className="font-medium text-ink">{label}</span>
      <span className="h-1.5 overflow-hidden rounded-pill border border-border bg-surface-subtle">
        <span className="block h-full rounded-pill bg-primary" style={{ width: `${value}%` }} />
      </span>
      <span dir="ltr" className="text-end text-xs text-ink-muted">
        {formatPercent(value)}
      </span>
    </div>
  );
}
