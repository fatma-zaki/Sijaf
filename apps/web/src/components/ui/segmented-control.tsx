import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SegmentedOption<Value extends string> = {
  value: Value;
  label: string;
  icon?: ReactNode;
};

type SegmentedControlProps<Value extends string> = {
  label: string;
  options: readonly SegmentedOption<Value>[];
  value: Value;
  onValueChange: (value: Value) => void;
  className?: string;
};

/** radiogroup: الأسهم بتنقل بين الاختيارات، وTab بيدخل على المختار بس */
export function SegmentedControl<Value extends string>({
  label,
  options,
  value,
  onValueChange,
  className,
}: SegmentedControlProps<Value>) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // في RTL السهم الشمال بيروح للي بعده
    const moves: Record<string, number> = { ArrowLeft: 1, ArrowDown: 1, ArrowRight: -1, ArrowUp: -1 };
    const delta = moves[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const index = options.findIndex((option) => option.value === value);
    const next = options[(index + delta + options.length) % options.length];
    onValueChange(next.value);
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons[options.indexOf(next)]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("flex gap-1 rounded-md border border-border bg-surface-subtle p-1", className)}
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onValueChange(option.value)}
            className="touch-target inline-flex h-8.5 flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-sm px-3 text-sm font-semibold text-ink-muted aria-checked:bg-surface aria-checked:text-primary aria-checked:shadow-card [&_svg]:size-4"
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
