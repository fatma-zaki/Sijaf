import { cn } from "@/lib/cn";

export type FilterChipOption<Value extends string> = {
  value: Value;
  label: string;
  count?: number;
};

type FilterChipsProps<Value extends string> = {
  label: string;
  options: readonly FilterChipOption<Value>[];
  value: Value;
  onValueChange: (value: Value) => void;
  className?: string;
};

export function FilterChips<Value extends string>({
  label,
  options,
  value,
  onValueChange,
  className,
}: FilterChipsProps<Value>) {
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onValueChange(option.value)}
          className="touch-target inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-pill border border-border-strong bg-surface px-4 text-sm font-medium text-ink-2 hover:bg-surface-subtle aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary"
        >
          {option.label}
          {option.count !== undefined && <span className="text-xs opacity-80">{option.count}</span>}
        </button>
      ))}
    </div>
  );
}
