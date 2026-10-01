import { z } from "zod";
import { operations, tiers, type Operation, type Tier } from "./catalog.js";
import { mobileSchema } from "./phone.js";
import { componentSlots, type ComponentSlot, type EditedLine, type PricingEdits, type PricingInput } from "./pricing/engine.js";

export const quoteStatuses = ["draft", "review", "sent", "accepted", "rejected"] as const;
export type QuoteStatus = (typeof quoteStatuses)[number];
export const quoteStatusLabels: Record<QuoteStatus, string> = {
  draft: "مسودة",
  review: "قيد المراجعة",
  sent: "أُرسل للعميل",
  accepted: "تم القبول",
  rejected: "مرفوض",
};

/** أماكن الستارة الشائعة («ستارة غرفة نوم») */
export const roomLabels = ["غرفة نوم", "صالون", "ريسبشن", "سفرة", "غرفة أطفال", "مطبخ", "مكتب", "حمام"] as const;

export const componentSlotLabels: Record<ComponentSlot, string> = {
  sheer: "الشيفون",
  main: "القماش الأساسي",
  lining: "البطانة",
  track: "المجرى",
  cornice: "الكرنيشة",
};

export const tierDescriptions: Record<Tier, string> = {
  economy: "خامات أساسية وتشطيب بسيط",
  standard: "أفضل توازن بين الجودة والسعر",
  premium: "خامات عالية الجودة وتشطيب مميز",
};

/** أقصى عدد صور في العرض الواحد */
export const MAX_QUOTE_PHOTOS = 4;

// ---------- الخطوة 1: العميل ----------

export const createQuoteSchema = z.object({
  clientName: z.string({ error: "اكتب اسم العميل" }).trim().min(2, "اكتب اسم العميل").max(80, "الاسم طويل زيادة"),
  clientPhone: mobileSchema,
  area: z.string().trim().max(80, "المنطقة طويلة زيادة").default(""),
  roomLabel: z.string().trim().max(40).default(""),
});
export type CreateQuoteInput = z.input<typeof createQuoteSchema>;
export type CreateQuoteData = z.output<typeof createQuoteSchema>;

// ---------- التحليل ----------

/**
 * ok: اتحلّلت · unclear: الصورة مش واضحة · not_curtain: مش ستارة
 * unavailable: التحليل مش متاح (مفيش مفتاح) · failed: خطأ مؤقت · skipped: من غير صورة
 */
export const analysisStatuses = ["ok", "unclear", "not_curtain", "unavailable", "failed", "skipped"] as const;
export type AnalysisStatus = (typeof analysisStatuses)[number];

export type QuoteAnalysisDto = {
  status: AnalysisStatus;
  /** متوسط الثقة 0–100 */
  confidence: number | null;
  color: string | null;
  notes: string | null;
};

// ---------- الخطوة 2: التفاصيل ----------

export const componentSources = ["ai", "manual"] as const;
export type ComponentSource = (typeof componentSources)[number];

export type QuoteComponentDto = {
  slot: ComponentSlot;
  materialId: string | null;
  included: boolean;
  source: ComponentSource;
  confidence: number | null;
  /** اقتراح الذكاء الاصطناعي الأصلي (عشان «رجّع الاقتراح» و«كانت: …») */
  aiMaterialId: string | null;
  aiIncluded: boolean | null;
};

const measurement = (label: string, max: number) =>
  z.coerce
    .number({ error: `اكتب ${label}` })
    .int(`${label} بالسنتيمتر من غير كسور`)
    .min(20, `${label} أقل من 20 سم`)
    .max(max, `${label} أكبر من ${max} سم`);

export const quoteDetailsSchema = z.object({
  modelId: z.uuid({ error: "اختار الموديل" }),
  operation: z.enum(operations).default("manual"),
  widthCm: measurement("العرض", 2000),
  heightCm: measurement("الارتفاع", 800),
  windowCount: z.coerce.number().int().min(1, "شباك واحد على الأقل").max(50, "عدد كبير زيادة").default(1),
  roomLabel: z.string().trim().max(40).default(""),
  components: z
    .array(
      z.object({
        slot: z.enum(componentSlots),
        materialId: z.uuid().nullable(),
        included: z.boolean(),
      }),
    )
    .max(componentSlots.length),
  optionalItemIds: z.array(z.uuid()).max(30).default([]),
  /** كرنيشة بسعر الإعدادات لو مفيش كرنيشة في الكتالوج */
  useDefaultCornice: z.boolean().default(false),
});
export type QuoteDetailsInput = z.input<typeof quoteDetailsSchema>;
export type QuoteDetailsData = z.output<typeof quoteDetailsSchema>;

// ---------- الخطوة 3: التسعير ----------

const money = z.coerce.number().min(0, "مايبقاش بالسالب").max(10_000_000, "رقم كبير زيادة");

export const pricingEditsSchema = z.object({
  overrides: z.record(z.string().max(80), z.object({ quantity: money.optional(), unitPrice: money.optional() })).default({}),
  removed: z.array(z.string().max(80)).max(50).default([]),
  manual: z
    .array(
      z.object({
        key: z.string().max(80),
        label: z.string().trim().min(2, "اكتب اسم البند").max(80, "الاسم طويل زيادة"),
        quantity: money,
        unitPrice: money,
      }),
    )
    .max(20)
    .default([]),
});

export const quotePricingSchema = z.object({
  tier: z.enum(tiers),
  edits: pricingEditsSchema,
  discount: money.default(0),
});
export type QuotePricingInput = z.input<typeof quotePricingSchema>;
export type QuotePricingData = z.output<typeof quotePricingSchema>;

/** اللي صفحة التسعير محتاجاه عشان تحسب التلات مستويات في المتصفح بنفس المحرك */
export type PricingContextDto = {
  input: PricingInput;
  tier: Tier;
  edits: PricingEdits;
  discount: number;
  depositPercent: number;
};

// ---------- العرض ----------

export type QuoteItemDto = EditedLine;

export type QuoteDto = {
  id: string;
  number: number;
  status: QuoteStatus;
  client: { id: string; name: string; phone: string; area: string };
  roomLabel: string;
  widthCm: number | null;
  heightCm: number | null;
  windowCount: number;
  modelId: string | null;
  modelName: string | null;
  modelSource: ComponentSource | null;
  modelConfidence: number | null;
  aiModelId: string | null;
  operation: Operation;
  optionalItemIds: string[];
  useDefaultCornice: boolean;
  tier: Tier | null;
  photoCount: number;
  analysis: QuoteAnalysisDto | null;
  components: QuoteComponentDto[];
  items: QuoteItemDto[];
  subtotal: number;
  discount: number;
  total: number;
  depositPercent: number;
  depositAmount: number;
  validUntil: string | null;
  createdAt: string;
  createdByName: string | null;
};

export type AnalyzeResultDto = { status: AnalysisStatus; quote: QuoteDto };
