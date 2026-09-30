import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "success" | "warning" | "info" | "neutral" | "brand";

const tones: Record<BadgeTone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning-fg [&_svg]:text-warning",
  info: "bg-info-soft text-info",
  neutral: "border border-border bg-surface-subtle text-ink-muted",
  brand: "h-5 bg-primary text-2xs text-on-primary",
};

type StatusBadgeProps = ComponentProps<"span"> & {
  tone?: BadgeTone;
  icon?: ReactNode;
};

export function StatusBadge({ tone = "neutral", icon, className, children, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-pill px-2.5 text-xs font-semibold [&_svg]:size-3.5 [&_svg]:shrink-0",
        tones[tone],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
