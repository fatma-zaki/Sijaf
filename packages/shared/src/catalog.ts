import { z } from "zod";
import { mobileSchema } from "./phone.js";

// ---------- القيم الثابتة وأسماؤها بالعربي ----------

export const materialLayers = ["sheer", "main", "lining", "track", "accessory", "motor"] as const;
export type MaterialLayer = (typeof materialLayers)[number];
export const layerLabels: Record<MaterialLayer, string> = {
  sheer: "شيفون",
  main: "قماش أساسي",
  lining: "بطانة",
  track: "مجاري وكرانيش",
  accessory: "إكسسوارات",
  motor: "موتورات وريموت",
};

export const tiers = ["economy", "standard", "premium"] as const;
export type Tier = (typeof tiers)[number];
export const tierLabels: Record<Tier, string> = { economy: "اقتصادي", standard: "متوسط", premium: "فاخر" };

export const materialUnits = ["meter", "linear_meter", "piece"] as const;
export type MaterialUnit = (typeof materialUnits)[number];
export const unitLabels: Record<MaterialUnit, string> = { meter: "متر", linear_meter: "متر طولي", piece: "قطعة" };

export const stockStatuses = ["available", "low", "out"] as const;
export type StockStatus = (typeof stockStatuses)[number];
export const stockLabels: Record<StockStatus, string> = { available: "متوفر", low: "كمية قليلة", out: "غير متوفر" };

/** شكل الخامة: بيتستخدم عشان كل مستوى ياخد أقرب خامة لنفس الشكل */
export const suggestedLooks: Partial<Record<MaterialLayer, readonly string[]>> = {
  main: ["قطيفة", "كتان", "ساتان", "جاكار مشجر", "سادة بلاك أوت"],
  sheer: ["سادة", "لينين", "مطرز"],
  lining: ["عادية", "بلاك أوت", "حراري"],
  track: ["مجرى", "كرنيشة"],
};

/** المجرى والكرنيشة بيتحسبوا مختلف في التسعير، فلازم نعرف ده من الشكل */
export const TRACK_LOOK = "مجرى";
export const CORNICE_LOOK = "كرنيشة";

export const paymentMethods = ["cash", "credit"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];
export const paymentLabels: Record<PaymentMethod, string> = { cash: "كاش", credit: "آجل" };

export const pricingMethods = ["linear_fullness", "square_meter", "piece"] as const;
export type PricingMethod = (typeof pricingMethods)[number];
export const pricingMethodLabels: Record<PricingMethod, string> = {
  linear_fullness: "بالمتر الطولي × معامل الكشكشة",
  square_meter: "بالمتر المربع",
  piece: "بالقطعة",
};
export const pricingMethodShortLabels: Record<PricingMethod, string> = {
  linear_fullness: "بالمتر الطولي",
  square_meter: "بالمتر المربع",
  piece: "بالقطعة",
};

export const operations = ["manual", "motorized"] as const;
export type Operation = (typeof operations)[number];
export const operationLabels: Record<Operation, string> = { manual: "يدوي", motorized: "موتور بريموت" };

/** بنود التشغيل (موتور وريموت وتركيبه) بتدخل العرض لما التشغيل يبقى موتور بس */
export const modelItemKinds = ["operation", "accessory"] as const;
export type ModelItemKind = (typeof modelItemKinds)[number];

export const itemBases = ["per_window", "per_fabric_meter", "per_side", "per_width_meter"] as const;
export type ItemBasis = (typeof itemBases)[number];
export const basisLabels: Record<ItemBasis, string> = {
  per_window: "للشباك",
  per_fabric_meter: "للمتر من القماش",
  per_side: "لكل جنب",
  per_width_meter: "للمتر من عرض الستارة",
};

/** شكل الستارة زي ما الذكاء الاصطناعي بيشوفه؛ بيربط نتيجة التحليل بموديلات المحل */
export const curtainStyles = ["pinch_pleat", "eyelet", "wave", "pencil_pleat", "roman", "roller", "other"] as const;
export type CurtainStyle = (typeof curtainStyles)[number];

// ---------- مساعدات ----------

const money = (label: string) =>
  z.coerce
    .number({ error: `اكتب ${label}` })
    .min(0, `${label} مايبقاش بالسالب`)
    .max(1_000_000, `${label} كبير زيادة`)
    .transform((value) => Math.round(value * 100) / 100);

/** سعر لازم يتكتب: الفاضي بيتحول لـ 0 مع coerce، فلازم أكبر من صفر */
const requiredMoney = (label: string) =>
  z.coerce
    .number({ error: `اكتب ${label}` })
    .positive(`اكتب ${label}`)
    .max(1_000_000, `${label} كبير زيادة`)
    .transform((value) => Math.round(value * 100) / 100);

const optionalText = (max: number) => z.string().trim().max(max, "النص طويل زيادة").default("");

const optionalMobile = z.union([mobileSchema, z.literal("").transform(() => null), z.null()]).default(null);

// ---------- الموردين ----------

export const supplierSchema = z
  .object({
    name: z.string({ error: "اكتب اسم المورد" }).trim().min(2, "اكتب اسم المورد").max(80, "الاسم طويل زيادة"),
    specialty: optionalText(80),
    contactName: optionalText(80),
    whatsapp: optionalMobile,
    address: optionalText(160),
    paymentMethod: z.enum(paymentMethods).default("cash"),
    creditDays: z.coerce.number().int().min(0).max(365).nullable().default(null),
    leadTimeMinDays: z.coerce.number().int().min(0).max(365).nullable().default(null),
    leadTimeMaxDays: z.coerce.number().int().min(0).max(365).nullable().default(null),
  })
  .refine((s) => s.leadTimeMinDays === null || s.leadTimeMaxDays === null || s.leadTimeMaxDays >= s.leadTimeMinDays, {
    message: "أقصى مدة لازم تبقى أكبر من أقل مدة",
    path: ["leadTimeMaxDays"],
  })
  .transform((s) => ({ ...s, creditDays: s.paymentMethod === "credit" ? s.creditDays : null }));
export type SupplierInput = z.input<typeof supplierSchema>;
export type SupplierData = z.output<typeof supplierSchema>;

export type SupplierDto = SupplierData & {
  id: string;
  materialsCount: number;
  pricesUpdatedAt: string;
};

/** أسعار المورد بتتعلّم قديمة بعد المدة دي */
export const STALE_PRICES_DAYS = 60;

// ---------- الخامات ----------

const materialNameSchema = z
  .string({ error: "اكتب اسم الخامة" })
  .trim()
  .min(2, "اكتب اسم الخامة")
  .max(80, "الاسم طويل زيادة");

export const materialSchema = z
  .object({
    name: materialNameSchema,
    layer: z.enum(materialLayers, { error: "اختار الطبقة" }),
    look: z.string().trim().max(40, "الشكل طويل زيادة").nullable().default(null),
    tier: z.enum(tiers).default("standard"),
    unit: z.enum(materialUnits).default("meter"),
    supplierId: z.uuid().nullable().default(null),
    supplierCode: optionalText(40),
    purchasePrice: money("سعر الشراء").nullable().default(null),
    sellPrice: requiredMoney("سعر البيع"),
    topWidthM: z.coerce.number().min(0.5, "عرض التوب أقل من نص متر").max(6, "عرض التوب كبير زيادة").nullable().default(null),
    stockStatus: z.enum(stockStatuses).default("available"),
  })
  .transform((m) => ({ ...m, look: m.look ? m.look : null }))
  .refine((m) => m.layer !== "track" || m.look === TRACK_LOOK || m.look === CORNICE_LOOK, {
    message: "اختار: مجرى ولا كرنيشة",
    path: ["look"],
  });
export type MaterialInput = z.input<typeof materialSchema>;
export type MaterialData = z.output<typeof materialSchema>;

/** اللي الفني بيشوفه: من غير سعر الشراء ولا الهامش */
export type MaterialPublicDto = {
  id: string;
  name: string;
  layer: MaterialLayer;
  look: string | null;
  tier: Tier;
  unit: MaterialUnit;
  sellPrice: number;
  topWidthM: number | null;
  stockStatus: StockStatus;
};

/** اللي صاحب المحل بيشوفه */
export type MaterialDto = MaterialPublicDto & {
  supplierId: string | null;
  supplierName: string | null;
  supplierCode: string;
  purchasePrice: number | null;
};

export function isOwnerMaterial(material: MaterialPublicDto | MaterialDto): material is MaterialDto {
  return "purchasePrice" in material;
}

/** هامش الربح: الفرق ونسبته من سعر البيع */
export function materialMargin(purchasePrice: number | null, sellPrice: number): { amount: number; percent: number } | null {
  if (purchasePrice === null || sellPrice <= 0) return null;
  const amount = Math.round((sellPrice - purchasePrice) * 100) / 100;
  return { amount, percent: (amount / sellPrice) * 100 };
}

export const materialListQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  layer: z.enum(materialLayers).optional(),
  tier: z.enum(tiers).optional(),
  /** أكتر من مورد مفصولين بفاصلة؛ "none" للخامات من غير مورد */
  suppliers: z.string().max(2000).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
});
export type MaterialListQuery = z.input<typeof materialListQuerySchema>;

export type MaterialListDto = {
  items: MaterialDto[];
  total: number;
  page: number;
  pageSize: number;
  /** للفلاتر: العدد من غير فلتر الطبقة/المورد */
  facets: {
    all: number;
    layers: Record<MaterialLayer, number>;
    suppliers: { id: string; name: string; count: number }[];
  };
};

// ---------- الاستيراد من Excel ----------

export const importRowSchema = z.object({
  name: materialNameSchema,
  layer: z.enum(materialLayers),
  look: z.string().trim().max(40).nullable().default(null),
  tier: z.enum(tiers).default("standard"),
  unit: z.enum(materialUnits).default("meter"),
  supplierName: z.string().trim().max(80).nullable().default(null),
  supplierCode: optionalText(40),
  purchasePrice: money("سعر الشراء").nullable().default(null),
  sellPrice: requiredMoney("سعر البيع"),
  topWidthM: z.coerce.number().min(0.5).max(6).nullable().default(null),
});
export type ImportRowInput = z.input<typeof importRowSchema>;
export type ImportRow = z.output<typeof importRowSchema>;

export const materialImportSchema = z.object({
  rows: z.array(importRowSchema).min(1, "الشيت فاضي").max(2000, "الشيت كبير زيادة، قسّمه لأكتر من ملف"),
});
export type MaterialImportInput = z.input<typeof materialImportSchema>;

export type MaterialImportResult = { created: number; updated: number; suppliersCreated: number };

// ---------- الموديلات ----------

export const modelItemSchema = z
  .object({
    id: z.uuid().optional(),
    kind: z.enum(modelItemKinds),
    /** بند من الكتالوج… */
    materialId: z.uuid().nullable().default(null),
    /** …أو بند بسعر ثابت (زي «تركيب وبرمجة الموتور») */
    label: z.string().trim().max(80, "اسم البند طويل زيادة").default(""),
    unitPrice: money("السعر").nullable().default(null),
    basis: z.enum(itemBases).default("per_window"),
    quantity: z.coerce.number().positive("الكمية لازم تبقى أكبر من صفر").max(1000),
    isRequired: z.boolean().default(true),
  })
  .refine((item) => item.materialId !== null || (item.label.length >= 2 && item.unitPrice !== null), {
    message: "اختار خامة من الكتالوج أو اكتب اسم البند وسعره",
    path: ["label"],
  });
export type ModelItemInput = z.input<typeof modelItemSchema>;
export type ModelItemData = z.output<typeof modelItemSchema>;

export const curtainModelSchema = z.object({
  name: z.string({ error: "اكتب اسم الموديل" }).trim().min(2, "اكتب اسم الموديل").max(60, "الاسم طويل زيادة"),
  pricingMethod: z.enum(pricingMethods),
  fullness: z.coerce.number().min(1, "معامل الكشكشة أقل من 1").max(4, "معامل الكشكشة كبير زيادة").default(1),
  laborPerUnit: money("المصنعية"),
  operation: z.enum(operations).default("manual"),
  technicianNote: optionalText(200),
  items: z.array(modelItemSchema).max(30, "بنود كتير زيادة").default([]),
});
export type CurtainModelInput = z.input<typeof curtainModelSchema>;
export type CurtainModelData = z.output<typeof curtainModelSchema>;

export type ModelItemDto = {
  id: string;
  kind: ModelItemKind;
  materialId: string | null;
  label: string;
  /** سعر البيع الحالي: من الكتالوج لو مربوط، أو السعر الثابت */
  price: number;
  unitPrice: number | null;
  supplierName: string | null;
  basis: ItemBasis;
  quantity: number;
  isRequired: boolean;
};

export type CurtainModelDto = {
  id: string;
  name: string;
  pricingMethod: PricingMethod;
  fullness: number;
  laborPerUnit: number;
  operation: Operation;
  style: CurtainStyle;
  technicianNote: string;
  items: ModelItemDto[];
};

export type CatalogCountsDto = { materials: number; suppliers: number; models: number };

export type TemplateApplyResult = { materials: number; suppliers: number; linkedItems: number };
