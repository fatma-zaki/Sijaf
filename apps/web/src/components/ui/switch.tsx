import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type SwitchProps = Omit<ComponentProps<"input">, "type" | "role" | "onChange"> & {
  label?: ReactNode;
  onCheckedChange?: (checked: boolean) => void;
};

export function Switch({ label, onCheckedChange, className, ...props }: SwitchProps) {
  return (
    <label className={cn("group inline-flex cursor-pointer items-center gap-2 text-sm text-ink-2", className)}>
      <input
        type="checkbox"
        role="switch"
        className="sr-only"
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        {...props}
      />
      <span
        aria-hidden
        className="touch-target relative h-5 w-9 flex-none rounded-pill bg-border-strong transition-colors group-has-checked:bg-primary group-has-focus-visible:outline-2 group-has-focus-visible:outline-offset-2 group-has-focus-visible:outline-focus-ring group-has-disabled:opacity-45"
      >
        <span className="absolute start-0.5 top-0.5 size-4 rounded-pill bg-surface transition-[inset-inline-start] group-has-checked:start-4.5" />
      </span>
      {label}
    </label>
  );
}
