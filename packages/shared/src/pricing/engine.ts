/**
 * محرك التسعير: functions نقية، نفس المدخلات بتدي نفس السعر دايمًا.
 * الذكاء الاصطناعي بيختار الخامات بس؛ الأسعار كلها من هنا.
 */
import {
  tiers,
  type CurtainModelDto,
  type MaterialLayer,
  type Operation,
  type Tier,
} from "../catalog.js";
import { arabicKey } from "../text.js";
import { fabricMeters, squareMeters, trackMeters } from "./geometry.js";
import { modelExtras } from "./model-extras.js";
import type { PricingRules } from "./rules.js";

export const layerSlots = ["sheer", "main", "lining"] as const;
export type LayerSlot = (typeof layerSlots)[number];
export const componentSlots = [...layerSlots, "track", "cornice"] as const;
export type ComponentSlot = (typeof componentSlots)[number];

/** اللي المحرك محتاجه من الخامة (سعر البيع بس؛ سعر الشراء مالوش دعوة بالسعر) */
export type PricingMaterial = {
  id: string;
  name: string;
  layer: MaterialLayer;
  look: string | null;
  tier: Tier;
  sellPrice: number;
  topWidthM: number | null;
};

export type PricingModel = Pick<CurtainModelDto, "pricingMethod" | "fullness" | "laborPerUnit" | "items">;

export type PricingInput = {
  widthCm: number;
  heightCm: number;
  windowCount: number;
  model: PricingModel;
  operation: Operation;
  /** البنود الاختيارية اللي العميل عايزها */
  optionalItemIds: readonly string[];
  /** الخامة المختارة (من التحليل أو يدوي) لكل خانة؛ الخانة الفاضية = مش في العرض */
  selections: Partial<Record<ComponentSlot, string>>;
  /** كرنيشة بسعر المتر من الإعدادات (لو مفيش كرنيشة مختارة من الكتالوج) */
  useDefaultCornice?: boolean;
  catalog: readonly PricingMaterial[];
  rules: PricingRules;
};

export type LineKind = "fabric" | "labor" | "track" | "cornice" | "installation" | "model_item" | "manual";

export type PricingLine = {
  /** ثابت بين مرات الحساب عشان التعديلات تتربط بيه: «fabric:main»، «item:<id>» */
  key: string;
  kind: LineKind;
  label: string;
  materialId: string | null;
  quantity: number;
  /** «9 م» أو «2 × 3.5 م» */
  quantityLabel: string;
  unitPrice: number;
  total: number;
};

export type TierQuote = {
  tier: Tier;
  lines: PricingLine[];
  subtotal: number;
  /** الخامة اللي المستوى ده استخدمها في كل خانة */
  materials: Partial<Record<ComponentSlot, PricingMaterial>>;
};

export const roundMoney = (value: number): number => Math.round(value * 100) / 100;

const formatQty = (value: number): string => String(Math.round(value * 100) / 100);

function withCount(label: string, count: number): string {
  return count > 1 ? `${label} × ${count}` : label;
}

/**
 * «أقرب خامة للمستوى»: نفس الطبقة ونفس الشكل في المستوى المطلوب والأقرب سعرًا للمختارة؛
 * لو مفيش، نفس الطبقة في المستوى ده؛ لو مفيش، الخامة المختارة نفسها.
 * المجاري والكرانيش لازم نفس النوع (مجرى ≠ كرنيشة).
 */
export function equivalentMaterial(chosen: PricingMaterial, tier: Tier, catalog: readonly PricingMaterial[]): PricingMaterial {
  if (chosen.tier === tier) return chosen;
  const lookKey = arabicKey(chosen.look ?? "");
  const sameLayer = catalog.filter(
    (m) => m.layer === chosen.layer && m.tier === tier && (chosen.layer !== "track" || m.look === chosen.look),
  );
  const sameLook = lookKey ? sameLayer.filter((m) => arabicKey(m.look ?? "") === lookKey) : [];
  const pool = sameLook.length > 0 ? sameLook : sameLayer;
  if (pool.length === 0) return chosen;
  return pool.reduce((best, m) =>
    Math.abs(m.sellPrice - chosen.sellPrice) < Math.abs(best.sellPrice - chosen.sellPrice) ? m : best,
  );
}

/** وحدات القماش لطبقة واحدة في شباك واحد */
function layerUnits(input: PricingInput, material: PricingMaterial): number {
  const { model, rules } = input;
  switch (model.pricingMethod) {
    case "linear_fullness":
      return fabricMeters(
        { widthCm: input.widthCm, heightCm: input.heightCm, fullness: model.fullness, topWidthM: material.topWidthM ?? rules.defaultTopWidthM },
        rules.allowances,
      ).meters;
    case "square_meter":
      return squareMeters(input.widthCm, input.heightCm, rules.allowances);
    case "piece":
      return 1;
  }
}

const unitSuffix: Record<PricingModel["pricingMethod"], string> = { linear_fullness: " م", square_meter: " م²", piece: "" };

function line(key: string, kind: LineKind, label: string, materialId: string | null, quantity: number, quantityLabel: string, unitPrice: number): PricingLine {
  return { key, kind, label, materialId, quantity, quantityLabel, unitPrice, total: roundMoney(quantity * unitPrice) };
}

/** سعر مستوى واحد */
export function priceTier(input: PricingInput, tier: Tier): TierQuote {
  const { model, rules, windowCount: count } = input;
  const byId = new Map(input.catalog.map((m) => [m.id, m]));
  const materials: TierQuote["materials"] = {};
  for (const slot of componentSlots) {
    const chosen = input.selections[slot] ? byId.get(input.selections[slot] as string) : undefined;
    if (chosen) materials[slot] = equivalentMaterial(chosen, tier, input.catalog);
  }

  const lines: PricingLine[] = [];
  const suffix = unitSuffix[model.pricingMethod];

  // القماش: كل طبقة بأمتارها (أو مساحتها) × عدد الشبابيك
  const units: Partial<Record<LayerSlot, number>> = {};
  for (const slot of layerSlots) {
    const material = materials[slot];
    if (!material) continue;
    units[slot] = layerUnits(input, material);
    const perWindow = `${formatQty(units[slot])}${suffix}`;
    lines.push(line(`fabric:${slot}`, "fabric", material.name, material.id, units[slot] * count, withCount(perWindow, count), material.sellPrice));
  }

  // المصنعية: الطولي على أمتار كل طبقة ماعدا البطانة؛ الرومانية/الرول/القطعة على قطعة قماش واحدة
  const laborUnits =
    model.pricingMethod === "linear_fullness" ? (units.sheer ?? 0) + (units.main ?? 0) : (units.main ?? units.sheer ?? 0);
  if (laborUnits > 0 && model.laborPerUnit > 0) {
    lines.push(line("labor", "labor", "خياطة وتفصيل", null, laborUnits * count, withCount(`${formatQty(laborUnits)}${suffix}`, count), model.laborPerUnit));
  }

  // المجرى: 2 لو فيه شيفون وقماش أساسي
  const rail = trackMeters(input.widthCm, rules.allowances);
  if (materials.track && model.pricingMethod === "linear_fullness") {
    const rails = materials.sheer && materials.main ? 2 : 1;
    const label = rails === 2 ? "مجرى مزدوج" : "مجرى مفرد";
    const perWindow = rails === 2 ? `2 × ${formatQty(rail)} م` : `${formatQty(rail)} م`;
    lines.push(line("track", "track", label, materials.track.id, rails * rail * count, withCount(perWindow, count), materials.track.sellPrice));
  }

  // الكرنيشة: من الكتالوج، ولو مفيش بسعر المتر من الإعدادات
  if (materials.cornice) {
    lines.push(line("cornice", "cornice", materials.cornice.name, materials.cornice.id, rail * count, withCount(`${formatQty(rail)} م`, count), materials.cornice.sellPrice));
  } else if (input.useDefaultCornice && rules.cornicePerMeter > 0) {
    lines.push(line("cornice", "cornice", "كرنيشة", null, rail * count, withCount(`${formatQty(rail)} م`, count), rules.cornicePerMeter));
  }

  // بنود الموديل (موتور، ريموت، إكسسوارات): الإجباري + الاختياري اللي اتختار
  const topWidth = (materials.main ?? materials.sheer)?.topWidthM ?? rules.defaultTopWidthM;
  const extras = modelExtras(model, input, input.operation, topWidth, rules.allowances);
  const chosenOptional = new Set(input.optionalItemIds);
  for (const extra of [...extras.required, ...extras.optional.filter((o) => chosenOptional.has(o.item.id))]) {
    const { item } = extra;
    const perWindow = item.basis === "per_fabric_meter" || item.basis === "per_width_meter" ? `${formatQty(extra.units)} م` : formatQty(extra.units);
    lines.push(line(`item:${item.id}`, "model_item", item.label, item.materialId, extra.units * count, withCount(perWindow, count), item.price));
  }

  if (rules.installationPerWindow > 0) {
    lines.push(line("installation", "installation", "تركيب", null, count, String(count), rules.installationPerWindow));
  }

  return { tier, lines, subtotal: roundMoney(lines.reduce((sum, l) => sum + l.total, 0)), materials };
}

/** التلات مستويات مرة واحدة */
export function priceAllTiers(input: PricingInput): Record<Tier, TierQuote> {
  return Object.fromEntries(tiers.map((tier) => [tier, priceTier(input, tier)])) as Record<Tier, TierQuote>;
}

// ---------- تعديلات صاحب المحل على البنود ----------

export type LineEdit = { quantity?: number; unitPrice?: number };
export type ManualLine = { key: string; label: string; quantity: number; unitPrice: number };
export type PricingEdits = {
  overrides: Record<string, LineEdit>;
  removed: readonly string[];
  manual: readonly ManualLine[];
};
export const EMPTY_EDITS: PricingEdits = { overrides: {}, removed: [], manual: [] };

export type EditedLine = PricingLine & {
  source: "system" | "manual";
  isEdited: boolean;
  originalQuantity: number | null;
  originalUnitPrice: number | null;
};

/** بيطبّق التعديلات على بنود المحرك: الأصل بيفضل محفوظ عشان «معدّل» و«رجّع» */
export function applyEdits(lines: readonly PricingLine[], edits: PricingEdits): EditedLine[] {
  const removed = new Set(edits.removed);
  const result: EditedLine[] = lines
    .filter((l) => !removed.has(l.key))
    .map((l) => {
      const edit = edits.overrides[l.key];
      const quantity = edit?.quantity ?? l.quantity;
      const unitPrice = edit?.unitPrice ?? l.unitPrice;
      const isEdited = quantity !== l.quantity || unitPrice !== l.unitPrice;
      return {
        ...l,
        quantity,
        unitPrice,
        // الكمية المعدّلة بتتكتب كرقم بدل «2 × 3.5 م»
        quantityLabel: quantity !== l.quantity ? formatQty(quantity) : l.quantityLabel,
        total: roundMoney(quantity * unitPrice),
        source: "system",
        isEdited,
        originalQuantity: l.quantity,
        originalUnitPrice: l.unitPrice,
      };
    });
  for (const m of edits.manual) {
    result.push({
      key: m.key,
      kind: "manual",
      label: m.label,
      materialId: null,
      quantity: m.quantity,
      quantityLabel: formatQty(m.quantity),
      unitPrice: m.unitPrice,
      total: roundMoney(m.quantity * m.unitPrice),
      source: "manual",
      isEdited: false,
      originalQuantity: null,
      originalUnitPrice: null,
    });
  }
  return result;
}

export type QuoteTotals = { subtotal: number; discount: number; total: number; deposit: number };

/** الإجمالي بعد الخصم، والعربون متقرّب لأقرب جنيه */
export function quoteTotals(lines: readonly Pick<PricingLine, "total">[], discount: number, depositPercent: number): QuoteTotals {
  const subtotal = roundMoney(lines.reduce((sum, l) => sum + l.total, 0));
  const safeDiscount = Math.min(Math.max(discount, 0), subtotal);
  const total = roundMoney(subtotal - safeDiscount);
  return { subtotal, discount: safeDiscount, total, deposit: Math.round((total * depositPercent) / 100) };
}
