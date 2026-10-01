import { z } from "zod";
import { DEFAULT_ALLOWANCES, type Allowances } from "./geometry.js";

/** قواعد التسعير لكل محل (إعدادات «تكاليف وقواعد تانية») */
export type PricingRules = {
  installationPerWindow: number;
  /** سعر متر الكرنيشة لو مفيش كرنيشة في الكتالوج */
  cornicePerMeter: number;
  /** عرض التوب لو الخامة مالهاش عرض */
  defaultTopWidthM: number;
  depositPercent: number;
  validityDays: number;
  allowances: Allowances;
};

export const DEFAULT_PRICING_RULES: PricingRules = {
  installationPerWindow: 250,
  cornicePerMeter: 450,
  defaultTopWidthM: 3,
  depositPercent: 30,
  validityDays: 7,
  allowances: DEFAULT_ALLOWANCES,
};

const amount = (label: string, max = 100_000) =>
  z.coerce.number({ error: `اكتب ${label}` }).min(0, `${label} مايبقاش بالسالب`).max(max, `${label} كبير زيادة`);

export const pricingRulesSchema = z.object({
  installationPerWindow: amount("سعر التركيب"),
  cornicePerMeter: amount("سعر الكرنيشة"),
  defaultTopWidthM: z.coerce.number().min(0.5, "عرض التوب أقل من نص متر").max(6, "عرض التوب كبير زيادة"),
  depositPercent: z.coerce.number().int("النسبة رقم صحيح").min(0).max(100, "النسبة من 0 لـ 100"),
  validityDays: z.coerce.number().int("عدد أيام صحيح").min(1, "يوم على الأقل").max(90, "90 يوم بالكتير"),
  allowances: z.object({
    rail: z.coerce.number().min(0).max(1),
    flat: z.coerce.number().min(0).max(2),
    drop: z.coerce.number().min(0).max(1),
    roundingStep: z.coerce.number().min(0.1).max(1),
  }),
});
export type PricingRulesInput = z.input<typeof pricingRulesSchema>;
