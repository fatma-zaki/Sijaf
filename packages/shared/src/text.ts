/**
 * مفتاح مقارنة للنصوص العربي: بيشيل التشكيل والتطويل ويوحّد الألف والتاء المربوطة والياء،
 * عشان «الأناضول للأقمشه» في الشيت تطابق «الأناضول للأقمشة» في الكتالوج.
 */
export function arabicKey(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
