import { formatDimensions, formatCurrency, formatNumber } from "@/lib/format";
import {
  modelExtras,
  unitLabels,
  type CurtainModelInput,
  type MaterialDto,
  type ModelItemDto,
  type PricingMethod,
} from "@sijaf/shared";

const EXAMPLE = { widthCm: 300, heightCm: 260 };
const EXAMPLE_TOP_WIDTH_M = 3;

type ExtrasPreviewProps = { values: CurtainModelInput; materials: Map<string, MaterialDto> };

/** «مثال: شباك 300 × 260 سم — الموديل ده بيزوّد على العرض» بقيم الفورم الحالية */
export function ExtrasPreview({ values, materials }: ExtrasPreviewProps) {
  const items: ModelItemDto[] = (values.items ?? []).map((item, index) => {
    const material = item.materialId ? materials.get(item.materialId) : undefined;
    return {
      id: String(index),
      kind: item.kind,
      materialId: item.materialId ?? null,
      label: material?.name ?? item.label ?? "",
      price: material?.sellPrice ?? (Number(item.unitPrice) || 0),
      unitPrice: null,
      supplierName: null,
      basis: item.basis ?? "per_window",
      quantity: Number(item.quantity) || 0,
      isRequired: item.isRequired ?? true,
    };
  });

  const fullness = Number(values.fullness);
  const pricingMethod: PricingMethod = values.pricingMethod ?? "linear_fullness";
  const extras = modelExtras(
    { pricingMethod, fullness: fullness >= 1 ? fullness : 1, items },
    EXAMPLE,
    values.operation ?? "manual",
    EXAMPLE_TOP_WIDTH_M,
  );

  const unitsText = (line: (typeof extras.required)[number]) =>
    line.item.basis === "per_fabric_meter" || line.item.basis === "per_width_meter"
      ? ` · ${formatNumber(line.units)} ${pricingMethod === "square_meter" && line.item.basis === "per_fabric_meter" ? "م²" : "م"}`
      : line.units > 1
        ? ` · ${formatNumber(line.units)} ${unitLabels.piece}`
        : "";

  return (
    <section aria-label="مثال" className="flex flex-col rounded-lg border border-border bg-surface px-5 py-4 shadow-card">
      <span className="text-xs text-ink-muted">مثال: شباك {formatDimensions(EXAMPLE.widthCm, EXAMPLE.heightCm)}</span>
      <span className="mb-1.5 mt-0.5 text-sm font-semibold text-ink">الموديل ده بيزوّد على العرض</span>
      {extras.required.length === 0 ? (
        <span className="py-2 text-sm text-ink-muted">مفيش بنود إجبارية.</span>
      ) : (
        extras.required.map((line) => (
          <div key={line.item.id} className="flex justify-between gap-3 border-b border-border py-2 text-sm">
            <span>
              {line.item.label}
              {unitsText(line)}
            </span>
            <span className="whitespace-nowrap font-semibold text-ink">{formatCurrency(line.total)}</span>
          </div>
        ))
      )}
      <div className="flex items-baseline justify-between pt-2.5">
        <span className="text-sm">الإجمالي الإضافي</span>
        <span className="text-2xl font-bold text-ink">{formatCurrency(extras.requiredTotal)}</span>
      </div>
      {extras.optional.length > 0 && (
        <span className="mt-1.5 text-xs text-ink-muted">
          الاختياري ({extras.optional.map((line) => line.item.label).join("، ")}) بيظهر للعميل كإضافة يختارها.
        </span>
      )}
    </section>
  );
}
