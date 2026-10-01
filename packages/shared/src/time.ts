/**
 * التواريخ بتوقيت المحل (القاهرة، فيها توقيت صيفي).
 * الأيام بتتكتب «YYYY-MM-DD» والساعات «HH:mm»، والتخزين UTC.
 */
export const SHOP_TIME_ZONE = "Africa/Cairo";

const partsFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: SHOP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function cairoParts(date: Date): { year: number; month: number; day: number; hour: number; minute: number } {
  const parts = Object.fromEntries(partsFormat.formatToParts(date).map((part) => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour), minute: Number(parts.minute) };
}

const pad = (value: number) => String(value).padStart(2, "0");

/** فرق توقيت القاهرة عن UTC بالدقايق في لحظة معيّنة (120 أو 180) */
function offsetMinutes(date: Date): number {
  const p = cairoParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return Math.round((asUtc - Math.floor(date.getTime() / 60_000) * 60_000) / 60_000);
}

/** «2026-10-01» + «11:00» بتوقيت القاهرة ← اللحظة بـ UTC */
export function cairoToUtc(date: string, time = "00:00"): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let utc = guess - offsetMinutes(new Date(guess)) * 60_000;
  // حوالين تغيير التوقيت الصيفي الفرق ممكن يختلف
  const corrected = guess - offsetMinutes(new Date(utc)) * 60_000;
  if (corrected !== utc) utc = corrected;
  return new Date(utc);
}

/** اليوم بتوقيت القاهرة «YYYY-MM-DD» */
export function cairoDate(date: Date): string {
  const p = cairoParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** الساعة بتوقيت القاهرة «HH:mm» */
export function cairoTime(date: Date): string {
  const p = cairoParts(date);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** جمع أيام على تاريخ «YYYY-MM-DD» */
export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** يوم الأسبوع: 0 الأحد … 6 السبت */
export function weekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** أول الأسبوع (السبت) اللي فيه التاريخ ده */
export function weekStart(date: string): string {
  return addDays(date, -((weekday(date) + 1) % 7));
}

/** أول الشهر، وممكن نرجع شهور لورا */
export function monthStart(date: string, monthsBack = 0): string {
  const [year, month] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1 - monthsBack, 1));
  return value.toISOString().slice(0, 10);
}

export const datePattern = /^\d{4}-\d{2}-\d{2}$/;
export const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
