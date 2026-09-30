import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ChoiceCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  /** شارة جنب العنوان: «الأسرع» */
  badge?: ReactNode;
  className?: string;
};

/** كارت اختيار طريقة (استيراد Excel / يدوي / نموذجي) */
export function ChoiceCard({ icon, title, description, selected, onSelect, badge, className }: ChoiceCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex flex-1 cursor-pointer flex-col items-start gap-2 rounded-md p-4.5 text-start",
        selected ? "border-2 border-primary bg-primary-soft" : "border border-border bg-surface hover:bg-surface-subtle",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-10 place-items-center rounded-sm [&_svg]:size-5",
          selected ? "bg-primary text-on-primary" : "bg-surface-subtle text-ink-2",
        )}
      >
        {icon}
      </span>
      <span className="flex items-center gap-2 text-md font-bold text-ink">
        {title}
        {badge}
      </span>
      <span className="text-sm text-ink-2">{description}</span>
    </button>
  );
}
