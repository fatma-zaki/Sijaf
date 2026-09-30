import { z } from "zod";

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EASTERN_ARABIC = "۰۱۲۳۴۵۶۷۸۹";

/** بيحوّل الأرقام العربي والفارسي لأرقام لاتيني: «٠١٠» ← «010» */
export function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const index = ARABIC_INDIC.indexOf(digit);
    return String(index >= 0 ? index : EASTERN_ARABIC.indexOf(digit));
  });
}

/**
 * رقم موبايل مصري بالشكل المحلي «01001234567».
 * بيقبل مسافات وشرطات و+20 و0020، وبيرجّع null لو الرقم مش موبايل مصري.
 */
export function normalizeEgyptianMobile(input: string): string | null {
  let digits = toLatinDigits(input).replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("0020")) digits = digits.slice(2);
  if (digits.startsWith("20") && digits.length === 12) digits = `0${digits.slice(2)}`;
  return /^01[0125]\d{8}$/.test(digits) ? digits : null;
}

/** «01001234567» ← «0100 123 4567» زي ما التصميم بيعرضه */
export function formatEgyptianMobile(mobile: string): string {
  return mobile.length === 11 ? `${mobile.slice(0, 4)} ${mobile.slice(4, 7)} ${mobile.slice(7)}` : mobile;
}

/** لينك wa.me محتاج الرقم الدولي من غير +: «201001234567» */
export function toWhatsAppNumber(mobile: string): string {
  return `20${mobile.slice(1)}`;
}

export const mobileSchema = z
  .string({ error: "اكتب رقم الموبايل" })
  .trim()
  .min(1, "اكتب رقم الموبايل")
  .transform((value, ctx) => {
    const normalized = normalizeEgyptianMobile(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "رقم الموبايل لازم يبقى 11 رقم ويبدأ بـ 01" });
      return z.NEVER;
    }
    return normalized;
  });
