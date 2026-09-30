/**
 * معادلات الأمتار: functions نقية، نفس المدخلات بتدي نفس النتيجة دايمًا.
 * المقاسات بالسنتيمتر والنتايج بالمتر.
 */

export type Allowances = {
  /** بيتزاد على عرض الشباك عشان المجرى: rail = width/100 + rail */
  rail: number;
  /** بيتزاد على القماش المفرود: flat = rail × fullness + flat */
  flat: number;
  /** بيتزاد على الطول: drop = height/100 + drop */
  drop: number;
  /** الأمتار بتتقرّب لفوق لأقرب مضاعف للرقم ده */
  roundingStep: number;
};

export const DEFAULT_ALLOWANCES: Allowances = { rail: 0.3, flat: 0.4, drop: 0.25, roundingStep: 0.5 };

/** تقريب لفوق لأقرب step، ومن غير ما أخطاء الـ floating point تزوّد خطوة */
export function roundUpTo(value: number, step: number): number {
  const units = Math.round((value / step) * 1e6) / 1e6;
  return Math.ceil(units) * step;
}

function assertPositive(name: string, value: number) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} لازم يبقى رقم أكبر من صفر`);
}

/** طول المجرى بالمتر قبل التقريب */
export function railLength(widthCm: number, allowances: Allowances = DEFAULT_ALLOWANCES): number {
  assertPositive("العرض", widthCm);
  return widthCm / 100 + allowances.rail;
}

/** أمتار المجرى/الكرنيشة: المجرى متقرّب لفوق (3.3 ← 3.5) */
export function trackMeters(widthCm: number, allowances: Allowances = DEFAULT_ALLOWANCES): number {
  return roundUpTo(railLength(widthCm, allowances), allowances.roundingStep);
}

export type FabricInput = {
  widthCm: number;
  heightCm: number;
  fullness: number;
  /** عرض توب القماش بالمتر */
  topWidthM: number;
};

export type FabricMeters = {
  rail: number;
  flat: number;
  drop: number;
  /** عدد العروض لو القماش اتفصّل بالعرض (1 لو الطول أقل من عرض التوب) */
  widths: number;
  meters: number;
};

/**
 * أمتار القماش لطبقة واحدة في شباك واحد:
 * لو الطول (drop) أقل من أو يساوي عرض التوب، القماش بيتلف والأمتار = المفرود.
 * غير كده بنحتاج كذا عرض: widths = ceil(flat / top) و meters = widths × drop.
 */
export function fabricMeters(
  { widthCm, heightCm, fullness, topWidthM }: FabricInput,
  allowances: Allowances = DEFAULT_ALLOWANCES,
): FabricMeters {
  assertPositive("الارتفاع", heightCm);
  assertPositive("معامل الكشكشة", fullness);
  assertPositive("عرض التوب", topWidthM);
  const rail = railLength(widthCm, allowances);
  const flat = rail * fullness + allowances.flat;
  const drop = heightCm / 100 + allowances.drop;

  if (drop <= topWidthM) {
    return { rail, flat, drop, widths: 1, meters: roundUpTo(flat, allowances.roundingStep) };
  }
  const widths = Math.ceil(Math.round((flat / topWidthM) * 1e6) / 1e6);
  return { rail, flat, drop, widths, meters: roundUpTo(widths * drop, allowances.roundingStep) };
}

/** مساحة الستارة الرومانية/الرول بالمتر المربع */
export function squareMeters(widthCm: number, heightCm: number, allowances: Allowances = DEFAULT_ALLOWANCES): number {
  assertPositive("العرض", widthCm);
  assertPositive("الارتفاع", heightCm);
  return roundUpTo((widthCm / 100) * (heightCm / 100 + allowances.drop), allowances.roundingStep);
}
