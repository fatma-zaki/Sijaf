import type { ComponentProps } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

type SearchFieldProps = Omit<ComponentProps<"input">, "type"> & {
  /** بيتقري لقارئ الشاشة، والـ placeholder بياخده لو مفيش غيره */
  label?: string;
};

export function SearchField({ label, placeholder, className, ...props }: SearchFieldProps) {
  return (
    <label className={cn("relative flex items-center", className)}>
      <span className="sr-only">{label ?? placeholder}</span>
      <input
        type="search"
        placeholder={placeholder}
        className="h-10 w-full rounded-sm border border-border-strong bg-surface pe-9.5 ps-3.5 text-base text-ink placeholder:text-ink-muted"
        {...props}
      />
      <Search aria-hidden className="pointer-events-none absolute end-3 size-4 text-ink-muted" />
    </label>
  );
}
