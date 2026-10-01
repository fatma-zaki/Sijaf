/**
 * تنسيق الأرقام والفلوس والتواريخ.
 * الأرقام لاتيني بفواصل، والعملة بعد الرقم: «10,700 ج.م».
 * التواريخ نسبية بتوقيت القاهرة: «اليوم - 10:24 ص».
 */

export const TIME_ZONE = "Africa/Cairo";
const LOCALE = "ar-EG-u-nu-latn";

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatCurrency(value: number): string {
  return `${formatNumber(value)} ج.م`;
}

export function formatMeters(value: number): string {
  return `${formatNumber(value)} م`;
}

/** بياخد نسبة من 0 لـ 100 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatDimensions(widthCm: number, heightCm: number): string {
  return `${formatNumber(widthCm)} × ${formatNumber(heightCm)} سم`;
}

function dateFormat(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...options });
}

const timeFormat = dateFormat({ hour: "numeric", minute: "2-digit" });
const weekdayFormat = dateFormat({ weekday: "long" });
const dayMonthFormat = dateFormat({ day: "numeric", month: "long" });
const dayMonthYearFormat = dateFormat({ day: "numeric", month: "long", year: "numeric" });
const partsFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** «10:24 ص» */
export function formatTime(date: Date): string {
  return timeFormat.format(date);
}

/** «الأربعاء 30 سبتمبر» */
export function formatWeekdayDate(date: Date): string {
  return `${weekdayFormat.format(date)} ${dayMonthFormat.format(date)}`;
}

/** «7 أكتوبر 2026» */
export function formatLongDate(date: Date): string {
  return dayMonthYearFormat.format(date);
}

/** «2026/09/30» */
export function formatShortDate(date: Date): string {
  return partsFormat.format(date).replaceAll("-", "/");
}

/** رقم اليوم بتوقيت القاهرة، عشان نقارن الأيام من غير ما الساعة تأثر */
function cairoDayNumber(date: Date): number {
  const [y, m, d] = partsFormat.format(date).split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** الفرق بالأيام بين تاريخين بتوقيت القاهرة (موجب لو date قبل now) */
export function daysAgo(date: Date, now: Date = new Date()): number {
  return cairoDayNumber(now) - cairoDayNumber(date);
}

/** «اليوم» / «أمس» / اسم اليوم لو في آخر أسبوع / التاريخ */
export function formatRelativeDay(date: Date, now: Date = new Date()): string {
  const diff = daysAgo(date, now);
  if (diff === 0) return "اليوم";
  if (diff === 1) return "أمس";
  if (diff > 1 && diff < 7) return weekdayFormat.format(date);
  return formatShortDate(date);
}

/** «اليوم - 10:24 ص» */
export function formatRelativeDateTime(date: Date, now: Date = new Date()): string {
  return `${formatRelativeDay(date, now)} - ${formatTime(date)}`;
}

/** «منذ 12 يوم» */
export function formatDaysAgo(date: Date, now: Date = new Date()): string {
  const diff = daysAgo(date, now);
  if (diff <= 0) return "النهارده";
  if (diff === 1) return "امبارح";
  return `منذ ${diff} ${diff <= 10 ? "أيام" : "يوم"}`;
}

/** يوم «YYYY-MM-DD» كـ Date (نص اليوم UTC بيفضل نفس اليوم بتوقيت القاهرة) */
export function dayToDate(day: string): Date {
  return new Date(`${day}T12:00:00Z`);
}

const shortWeekdayFormat = dateFormat({ weekday: "short" });
const dayNumberFormat = dateFormat({ day: "numeric" });
const monthFormat = dateFormat({ month: "long" });

/** «السبت» */
export function formatWeekday(date: Date): string {
  return weekdayFormat.format(date);
}

/** «سبت» للتابات الضيقة */
export function formatShortWeekday(date: Date): string {
  return shortWeekdayFormat.format(date).replace(/^ال/, "");
}

/** «26» */
export function formatDayNumber(date: Date): string {
  return dayNumberFormat.format(date);
}

/** «26 سبتمبر» */
export function formatDayMonth(date: Date): string {
  return dayMonthFormat.format(date);
}

/** «سبتمبر» */
export function formatMonthName(date: Date): string {
  return monthFormat.format(date);
}

/** نسبة التغيير عن الفترة اللي فاتت: «+18%» / «-5%»، وnull لو مفيش أساس للمقارنة */
export function formatChange(current: number, previous: number): string | null {
  if (previous <= 0) return null;
  const change = Math.round(((current - previous) / previous) * 100);
  return `${change >= 0 ? "+" : ""}${change}%`;
}
