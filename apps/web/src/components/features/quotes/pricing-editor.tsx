"use client";

import {
  applyEdits,
  priceAllTiers,
  quoteTotals,
  tierDescriptions,
  tierLabels,
  type EditedLine,
  type LineEdit,
  type ManualLine,
  type PricingContextDto,
  type PricingEdits,
  type Tier,
} from "@sijaf/shared";
import { ChevronLeft, PencilLine, Plus, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, InputWithUnit } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { TierCard } from "@/components/ui/tier-card";
import { cn } from "@/lib/cn";
import { formatCurrency, formatNumber } from "@/lib/format";
import { saveQuotePricing } from "./actions";

// على الشاشة الكبيرة: فاخر يمين ومتوسط في النص (زي التصميم)؛ على الموبايل من الأرخص
const cardOrder: Tier[] = ["premium", "standard", "economy"];
const rowOrder: Tier[] = ["economy", "standard", "premium"];

const parseAmount = (value: string): number | null => {
  const normalized = value.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[,،\s]/g, "");
  if (normalized === "") return null;
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const lineGrid =
  "grid grid-cols-2 items-center gap-x-3 gap-y-2 @min-[40rem]:grid-cols-[minmax(0,1fr)_110px_120px_110px_88px]";

type PricingEditorProps = { quoteId: string; context: PricingContextDto };

/** الخطوة 3: التلات مستويات وتفاصيل المستوى المختار، وكل رقم قابل للتعديل (Quote-Pricing) */
export function PricingEditor({ quoteId, context }: PricingEditorProps) {
  const router = useRouter();
  const [tier, setTier] = useState<Tier>(context.tier);
  const [edits, setEdits] = useState<PricingEdits>(context.edits);
  const [discountText, setDiscountText] = useState(context.discount ? String(context.discount) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const tiers = useMemo(() => priceAllTiers(context.input), [context.input]);
  const lines = applyEdits(tiers[tier].lines, edits);
  const totals = quoteTotals(lines, parseAmount(discountText) ?? 0, context.depositPercent);
  const originals = new Map(tiers[tier].lines.map((line) => [line.key, line]));

  // تغيير المستوى بيبدأ البنود من جديد (الخامات اتغيرت)، والبنود اليدوي بتفضل
  const chooseTier = (next: Tier) => {
    setTier(next);
    setEdits((current) => ({ overrides: {}, removed: [], manual: current.manual }));
  };

  const editLine = (line: EditedLine, change: LineEdit) => {
    if (line.source === "manual") {
      setEdits((current) => ({ ...current, manual: current.manual.map((m) => (m.key === line.key ? { ...m, ...change } : m)) }));
      return;
    }
    const original = originals.get(line.key);
    setEdits((current) => {
      const merged = { ...current.overrides[line.key], ...change };
      // الرجوع للقيمة الأصلية = مش معدّل
      const quantity = merged.quantity === original?.quantity ? undefined : merged.quantity;
      const unitPrice = merged.unitPrice === original?.unitPrice ? undefined : merged.unitPrice;
      const overrides = { ...current.overrides };
      if (quantity === undefined && unitPrice === undefined) delete overrides[line.key];
      else overrides[line.key] = { ...(quantity !== undefined && { quantity }), ...(unitPrice !== undefined && { unitPrice }) };
      return { ...current, overrides };
    });
  };

  const renameManual = (key: string, label: string) =>
    setEdits((current) => ({ ...current, manual: current.manual.map((m) => (m.key === key ? { ...m, label } : m)) }));

  const resetLine = (key: string) =>
    setEdits((current) => {
      const overrides = { ...current.overrides };
      delete overrides[key];
      return { ...current, overrides };
    });

  const removeLine = (line: EditedLine) =>
    setEdits((current) =>
      line.source === "manual"
        ? { ...current, manual: current.manual.filter((m) => m.key !== line.key) }
        : { ...current, removed: [...current.removed, line.key] },
    );

  const addLine = () =>
    setEdits((current) => ({
      ...current,
      manual: [...current.manual, { key: `new:${current.manual.length + 1}:${Date.now()}`, label: "", quantity: 1, unitPrice: 0 } satisfies ManualLine],
    }));

  const save = async () => {
    if (edits.manual.some((m) => m.label.trim().length < 2)) {
      setError("اكتب اسم كل بند مضاف أو امسحه");
      return;
    }
    setSaving(true);
    setError(undefined);
    const result = await saveQuotePricing(quoteId, { tier, edits, discount: parseAmount(discountText) ?? 0 });
    if (!result.ok) {
      setError(result.message);
      setSaving(false);
      return;
    }
    router.push(`/quotes/${quoteId}/final`);
  };

  const priceOf = (value: Tier) => (value === tier ? totals.total : tiers[value].subtotal);
  const fullness = context.input.model.pricingMethod === "linear_fullness" ? context.input.model.fullness : null;

  return (
    <div className="flex grow flex-col gap-4 lg:gap-6">
      <div className="hidden gap-4 pt-2.5 md:grid md:grid-cols-3 lg:gap-6">
        {cardOrder.map((value) => (
          <TierCard
            key={value}
            name={tierLabels[value]}
            price={priceOf(value)}
            description={tierDescriptions[value]}
            selected={value === tier}
            onSelect={() => chooseTier(value)}
            ribbon={value === "standard" ? "الأكثر استخداماً" : undefined}
            premium={value === "premium"}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2.5 md:hidden">
        {rowOrder.map((value) => (
          <TierCard
            key={value}
            layout="row"
            name={tierLabels[value]}
            price={priceOf(value)}
            description={tierDescriptions[value]}
            selected={value === tier}
            onSelect={() => chooseTier(value)}
            ribbon={value === "standard" ? "الأكثر استخداماً" : undefined}
            premium={value === "premium"}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        <section aria-label={`تفاصيل العرض (المستوى ${tierLabels[tier]})`} className="@container overflow-hidden rounded-lg border border-border bg-surface shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex flex-col">
              <h2 className="m-0 text-lg font-bold text-ink">تفاصيل العرض (المستوى {tierLabels[tier]})</h2>
              <span className="text-xs text-ink-muted">الكميات والأسعار محسوبة تلقائي، وتقدر تعدّل أي رقم</span>
            </div>
            <Button variant="secondary" size="sm" onClick={addLine}>
              إضافة بند
              <Plus aria-hidden />
            </Button>
          </div>
          <div className={cn(lineGrid, "hidden border-y border-border bg-surface-subtle px-5 py-2.5 text-xs font-medium text-ink-muted @min-[40rem]:grid")}>
            <span>البند</span>
            <span>الكمية</span>
            <span>سعر الوحدة</span>
            <span>الإجمالي</span>
            <span />
          </div>
          <ul className="m-0 list-none p-0">
            {lines.map((line) => (
              <li key={line.key} className={cn(lineGrid, "border-b border-border px-5 py-3 last:border-b-0")}>
                <span className="col-span-2 @min-[40rem]:col-span-1">
                  {line.source === "manual" ? (
                    <input
                      aria-label="اسم البند"
                      placeholder="اسم البند (مثال: فك ستارة قديمة)"
                      value={line.label}
                      onChange={(event) => renameManual(line.key, event.target.value)}
                      className="h-9 w-full rounded-sm border border-border-strong bg-surface px-2 text-ink"
                    />
                  ) : (
                    <span className="font-medium text-ink">{line.label}</span>
                  )}
                </span>
                <AmountInput
                  label={`كمية ${line.label || "البند"}`}
                  value={line.quantity}
                  display={line.quantityLabel}
                  edited={line.source === "system" && line.quantity !== line.originalQuantity}
                  onChange={(quantity) => editLine(line, { quantity })}
                />
                <AmountInput
                  label={`سعر ${line.label || "البند"}`}
                  value={line.unitPrice}
                  display={formatNumber(line.unitPrice)}
                  unit="ج.م"
                  edited={line.source === "system" && line.unitPrice !== line.originalUnitPrice}
                  onChange={(unitPrice) => editLine(line, { unitPrice })}
                />
                <span className="whitespace-nowrap font-semibold text-ink">{formatCurrency(line.total)}</span>
                <span className="flex items-center justify-end gap-1">
                  {line.isEdited && (
                    <Button variant="ghost" size="sm" onClick={() => resetLine(line.key)} aria-label={`رجّع ${line.label} للمحسوب`} className="px-2 text-xs">
                      <PencilLine aria-hidden />
                      معدّل
                      <RotateCcw aria-hidden />
                    </Button>
                  )}
                  {!line.isEdited && (
                    <Button variant="ghost" size="sm" iconOnly aria-label={`حذف ${line.label || "البند"}`} onClick={() => removeLine(line)}>
                      <Trash2 aria-hidden />
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {edits.removed.length > 0 && (
            <div className="border-t border-border px-5 py-2 text-sm">
              <button type="button" className="min-h-11 cursor-pointer font-semibold text-link hover:text-primary" onClick={() => setEdits((current) => ({ ...current, removed: [] }))}>
                رجّع البنود المحذوفة ({edits.removed.length})
              </button>
            </div>
          )}
        </section>

        <Card className="flex h-max flex-col gap-3">
          <span className="text-sm text-ink-muted">الإجمالي النهائي</span>
          <span className="text-3xl font-bold text-ink">{formatCurrency(totals.total)}</span>
          {fullness !== null && <span className="text-xs text-ink-muted">الكمية محسوبة بمعامل كشكشة × {formatNumber(fullness)} + هوامش</span>}
          <dl className="m-0 flex flex-col">
            {[
              ["إجمالي البنود", formatCurrency(totals.subtotal)],
              ["خصم", formatCurrency(totals.discount)],
              [`العربون المطلوب (${context.depositPercent}%)`, formatCurrency(totals.deposit)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-border py-2.5 text-sm last:border-b-0">
                <dt className="text-ink-2">{label}</dt>
                <dd className="m-0 font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <Field label="خصم خاص (ج.م)">
            <InputWithUnit unit="ج.م" inputMode="decimal" placeholder="0" value={discountText} onChange={(event) => setDiscountText(event.target.value)} />
          </Field>
        </Card>
      </div>

      <FormError message={error} />
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <Button size="lg" onClick={() => void save()} disabled={saving} className="min-w-40">
          {saving ? "بنحفظ..." : "متابعة"}
          <ChevronLeft aria-hidden />
        </Button>
        <Link href={`/quotes/${quoteId}/details`} className={buttonStyles({ variant: "secondary" })}>
          رجوع
        </Link>
      </div>
    </div>
  );
}

type AmountInputProps = {
  label: string;
  value: number;
  /** «9 م» أو «2 × 3.5 م» لما الرقم مش متعدّل */
  display: string;
  unit?: string;
  edited: boolean;
  onChange: (value: number) => void;
};

/** خانة رقم في البنود: بتعرض الكمية بوحدتها، وبتتحول لرقم وإنت بتعدّل */
function AmountInput({ label, value, display, unit, edited, onChange }: AmountInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <span className="relative block">
      <input
        aria-label={label}
        inputMode="decimal"
        value={draft ?? (unit ? formatNumber(value) : display)}
        onFocus={() => setDraft(String(value))}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const parsed = draft === null ? null : parseAmount(draft);
          if (parsed !== null && parsed !== value) onChange(parsed);
          setDraft(null);
        }}
        className={cn(
          "h-9 w-full rounded-sm border bg-surface px-2 text-center text-ink",
          unit && "pe-10",
          edited ? "border-primary bg-primary-soft" : "border-border-strong",
        )}
      />
      {unit && <span className="pointer-events-none absolute end-2 top-2 text-xs text-ink-muted">{unit}</span>}
    </span>
  );
}

