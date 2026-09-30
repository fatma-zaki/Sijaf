/**
 * أمثلة لعرض المكوّنات في صفحة /design-system بس، ومنقولة من شاشات التصميم.
 * مش بيانات تطبيق: بيانات التطبيق الحقيقية جاية من الـ API.
 */

export const colorTokens = [
  "canvas", "surface", "surface-subtle", "surface-info",
  "pine-900", "pine-800", "pine-700", "on-pine-muted",
  "primary", "primary-hover", "primary-soft",
  "ink", "ink-2", "ink-muted", "border", "border-strong", "link",
  "gold", "success", "success-soft", "growth",
  "warning", "warning-fg", "warning-soft",
  "danger", "danger-fg", "info", "info-soft",
] as const;

export const typeScale = [
  { className: "text-4xl font-bold text-ink", label: "text-4xl · 28/40 · عنوان الصفحة" },
  { className: "text-3xl font-bold text-ink", label: "text-3xl · 26/34 · أرقام وأسعار" },
  { className: "text-2xl font-bold text-ink", label: "text-2xl · 20/30 · عنوان الحالة الفاضية" },
  { className: "text-xl font-bold text-ink", label: "text-xl · 19/28 · عنوان النافذة" },
  { className: "text-lg font-bold text-ink", label: "text-lg · 17/26 · عنوان الكارت" },
  { className: "text-md font-semibold text-ink", label: "text-md · 15/24" },
  { className: "text-base text-ink-2", label: "text-base · 14/22 · النص الأساسي" },
  { className: "text-sm text-ink-2", label: "text-sm · 13/20 · labels" },
  { className: "text-xs text-ink-muted", label: "text-xs · 12/18 · ملاحظات" },
  { className: "text-2xs font-semibold text-ink-muted", label: "text-2xs · 11/16" },
] as const;

export const quoteSteps = ["رفع الصورة", "التفاصيل", "التسعير", "العرض النهائي"] as const;

export type SampleMaterial = {
  id: string;
  name: string;
  layer: string;
  tier: string;
  supplier: string;
  purchase: number;
  sell: number;
};

export const sampleMaterials: SampleMaterial[] = [
  { id: "1", name: "شيفون سادة", layer: "شيفون", tier: "اقتصادي", supplier: "النيل للمنسوجات", purchase: 130, sell: 170 },
  { id: "2", name: "شيفون لينين", layer: "شيفون", tier: "متوسط", supplier: "الأناضول للأقمشة", purchase: 215, sell: 290 },
  { id: "3", name: "قطيفة تركي", layer: "قماش أساسي", tier: "متوسط", supplier: "الأناضول للأقمشة", purchase: 415, sell: 560 },
  { id: "4", name: "قطيفة إيطالي", layer: "قماش أساسي", tier: "فاخر", supplier: "المتوسط للأقمشة المستوردة", purchase: 645, sell: 900 },
];

export const sampleTiers = [
  { id: "premium", name: "فاخر", price: 17230, description: "خامات عالية الجودة وتشطيب مميز" },
  { id: "standard", name: "متوسط", price: 10700, description: "أفضل توازن بين الجودة والسعر" },
  { id: "economy", name: "اقتصادي", price: 7120, description: "خامات أساسية وتشطيب بسيط" },
] as const;
