import { CircleCheck, Crown } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { Button } from "./button";
import { StatusBadge } from "./status-badge";

type TierCardProps = {
  name: string;
  price: number;
  description: string;
  selected: boolean;
  onSelect?: () => void;
  /** شريط فوق الكارت: «الأكثر استخداماً» */
  ribbon?: string;
  /** تاج ذهبي للمستوى الفاخر */
  premium?: boolean;
  /** card: كارت عمودي (تابلت ولابتوب) — row: صف بدايرة اختيار (موبايل) */
  layout?: "card" | "row";
  className?: string;
};

export function TierCard({ layout = "card", ...props }: TierCardProps) {
  return layout === "row" ? <TierRow {...props} /> : <TierColumn {...props} />;
}

function TierColumn({ name, price, description, selected, onSelect, ribbon, premium, className }: TierCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-md bg-surface px-4 pb-4 pt-6 text-center",
        selected ? "border-2 border-primary shadow-raised" : "border border-border",
        className,
      )}
    >
      {ribbon && (
        <span className="absolute inset-x-0 -top-2.5 mx-auto w-max">
          <StatusBadge tone="brand">{ribbon}</StatusBadge>
        </span>
      )}
      {premium && <Crown aria-hidden className="size-5 text-gold" />}
      <div className="text-md font-semibold text-ink">{name}</div>
      <div className="text-3xl font-bold text-ink">{formatCurrency(price)}</div>
      <div className="mb-2 text-xs text-ink-muted">{description}</div>
      <Button
        variant={selected ? "primary" : "soft"}
        size="sm"
        block
        aria-pressed={selected}
        aria-label={`اختيار المستوى ${name}`}
        onClick={onSelect}
        className="mt-auto"
      >
        {selected ? (
          <>
            مختار
            <CircleCheck aria-hidden />
          </>
        ) : (
          "اختر"
        )}
      </Button>
    </div>
  );
}

function TierRow({ name, price, description, selected, onSelect, ribbon, premium, className }: TierCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex min-h-18 w-full cursor-pointer items-center gap-3 rounded-md bg-surface px-4 py-3.5 text-start",
        selected ? "border-2 border-primary shadow-raised" : "border border-border",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-5 flex-none rounded-pill",
          selected ? "border-6 border-primary" : "border-2 border-border-strong",
        )}
      />
      <span className="flex grow flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-md font-semibold text-ink">
          {name}
          {premium && <Crown aria-hidden className="size-4 text-gold" />}
          {ribbon && <StatusBadge tone="brand">{ribbon}</StatusBadge>}
        </span>
        <span className="text-xs text-ink-muted">{description}</span>
      </span>
      <span className="whitespace-nowrap text-lg font-bold text-ink">{formatCurrency(price)}</span>
    </button>
  );
}
