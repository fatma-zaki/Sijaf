import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";

type StatCardProps = {
  value: ReactNode;
  label: string;
  /** زيادة عن الفترة اللي فاتت: «+18» أو «+12%» */
  delta?: string;
  icon?: ReactNode;
  className?: string;
};

export function StatCard({ value, label, delta, icon, className }: StatCardProps) {
  const down = delta?.startsWith("-");
  const Trend = down ? TrendingDown : TrendingUp;
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-5 shadow-card",
        className,
      )}
    >
      <div>
        <div className="text-3xl font-bold text-ink">{value}</div>
        <div className="text-sm text-ink-muted">{label}</div>
        {delta && (
          <div dir="ltr" className={cn("mt-2 inline-flex items-center gap-1 text-xs font-semibold", down ? "text-ink-muted" : "text-growth")}>
            <Trend aria-hidden className="size-3.5" />
            {delta}
          </div>
        )}
      </div>
      {icon && (
        <span className="grid size-9 flex-none place-items-center rounded-sm bg-info-soft text-info [&_svg]:size-4.5">
          {icon}
        </span>
      )}
    </div>
  );
}
