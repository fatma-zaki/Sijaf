import { LOW_CONFIDENCE } from "@/components/ui/confidence";
import type { QuoteComponentDto, QuoteItemDto } from "@sijaf/shared";

export const quoteSteps = ["رفع الصورة", "التفاصيل", "التسعير", "العرض النهائي"] as const;

export type QuoteGroup = { label: string; total: number };

const groupLabels: Partial<Record<QuoteItemDto["kind"], string>> = {
  fabric: "قماش وبطانة",
  labor: "خياطة وتركيب",
  installation: "خياطة وتركيب",
  model_item: "موتور وإكسسوارات",
};

/**
 * البنود متجمّعة زي العرض النهائي في التصميم: «قماش وبطانة»، «مجرى مزدوج»، «خياطة وتركيب».
 * المجرى والكرنيشة والبنود اليدوي بأسمائهم.
 */
export function groupQuoteLines(items: readonly Pick<QuoteItemDto, "kind" | "label" | "total">[]): QuoteGroup[] {
  const groups = new Map<string, number>();
  for (const item of items) {
    const label = groupLabels[item.kind] ?? item.label;
    groups.set(label, Math.round(((groups.get(label) ?? 0) + item.total) * 100) / 100);
  }
  return [...groups].map(([label, total]) => ({ label, total }));
}

/** «ستارة غرفة نوم — ويفي» */
export function curtainTitle(roomLabel: string, modelName: string | null): string {
  const base = roomLabel ? `ستارة ${roomLabel}` : "ستارة";
  return modelName ? `${base} — ${modelName.replace(/\s*\(.*\)$/, "")}` : base;
}

/** «شباك واحد» / «شباكين» / «3 شبابيك» */
export function windowsText(count: number): string {
  if (count === 1) return "شباك واحد";
  if (count === 2) return "شباكين";
  return `${count} ${count <= 10 ? "شبابيك" : "شباك"}`;
}

export type SourceTone = "ai" | "edited" | "low" | "manual";

/** نص «المصدر» في جدول التحليل */
export function componentSource(
  component: Pick<QuoteComponentDto, "source" | "confidence" | "aiMaterialId" | "materialId">,
  materialName: (id: string) => string | undefined,
): { tone: SourceTone; text: string } {
  if (component.source === "ai" && component.aiMaterialId !== null) {
    return component.confidence !== null && component.confidence < LOW_CONFIDENCE
      ? { tone: "low", text: "ثقة ضعيفة · راجعها" }
      : { tone: "ai", text: "من الذكاء الاصطناعي" };
  }
  if (component.aiMaterialId && component.aiMaterialId !== component.materialId) {
    return { tone: "edited", text: `عدّلتها · كانت: ${materialName(component.aiMaterialId) ?? "اقتراح تاني"}` };
  }
  return { tone: "manual", text: component.aiMaterialId ? "عدّلتها" : "اختيار يدوي" };
}
