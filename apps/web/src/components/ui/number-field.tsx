"use client";

import { useId } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

type NumberFieldProps = {
  label: string;
  value: number | null;
  onValueChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  error?: string;
  name?: string;
  className?: string;
};

function clamp(value: number, min?: number, max?: number): number {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}

export function NumberField({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  hint,
  error,
  name,
  className,
}: NumberFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const stepBy = (delta: number) => onValueChange(clamp((value ?? 0) + delta, min, max));

  const stepButton =
    "touch-target grid h-full w-9 flex-none cursor-pointer place-items-center text-ink-muted hover:bg-surface-subtle hover:text-primary disabled:cursor-not-allowed disabled:opacity-45";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink-2">
        {label}
      </label>
      <div
        className={cn(
          "flex h-10 items-center overflow-hidden rounded-sm border bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring",
          error ? "border-danger" : "border-border-strong",
        )}
      >
        <button
          type="button"
          aria-label={`تقليل ${label}`}
          className={stepButton}
          disabled={min !== undefined && value !== null && value <= min}
          onClick={() => stepBy(-step)}
        >
          <Minus aria-hidden className="size-4" />
        </button>
        <input
          id={id}
          name={name}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value ?? ""}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          onChange={(event) => {
            const raw = event.target.value;
            onValueChange(raw === "" ? null : Number(raw));
          }}
          className="h-full min-w-0 flex-1 appearance-none border-0 bg-transparent text-center text-md font-semibold text-ink outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label={`زيادة ${label}`}
          className={stepButton}
          disabled={max !== undefined && value !== null && value >= max}
          onClick={() => stepBy(step)}
        >
          <Plus aria-hidden className="size-4" />
        </button>
      </div>
      {(error || hint) && (
        <span id={messageId} role={error ? "alert" : undefined} className={cn("text-xs", error ? "text-danger-fg" : "text-ink-muted")}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}
