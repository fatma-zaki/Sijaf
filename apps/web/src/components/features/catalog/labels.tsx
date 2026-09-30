import { layerLabels, materialMargin, tierLabels, type MaterialPublicDto, type Tier } from "@sijaf/shared";
import { Crown } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatPercent } from "@/lib/format";

/** «النوع» في الجدول زي التصميم: القماش الأساسي بشكله (قطيفة، كتان…) والمجاري (مجرى/كرنيشة)، والباقي باسم الطبقة */
export function materialKind(material: Pick<MaterialPublicDto, "look" | "layer">): string {
  const showLook = material.layer === "main" || material.layer === "track";
  return (showLook && material.look) || layerLabels[material.layer];
}

/** المستوى، والفاخر بتاج ذهبي زي التصميم */
export function TierLabel({ tier, className }: { tier: Tier; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {tier === "premium" && <Crown aria-hidden className="size-3.5 text-gold" />}
      {tierLabels[tier]}
    </span>
  );
}

/** «145 ج.م 26%» */
type MarginLabelProps = { purchasePrice: number | null; sellPrice: number; stacked?: boolean };

export function MarginLabel({ purchasePrice, sellPrice, stacked = false }: MarginLabelProps) {
  const margin = materialMargin(purchasePrice, sellPrice);
  if (!margin) return <span className="text-ink-muted">—</span>;
  return (
    <span className={cn("inline-flex whitespace-nowrap", stacked ? "flex-col leading-4.5" : "items-baseline gap-1.5")}>
      <span className={cn("font-semibold", margin.amount >= 0 ? "text-growth" : "text-danger-fg")}>
        {formatCurrency(margin.amount)}
      </span>
      <span className="text-xs text-ink-muted">{formatPercent(margin.percent)}</span>
    </span>
  );
}
