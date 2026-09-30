import { STALE_PRICES_DAYS, paymentLabels, type SupplierDto } from "@sijaf/shared";
import { daysAgo } from "@/lib/format";

/** «آجل 30 يوم» / «كاش» */
export function paymentText(supplier: Pick<SupplierDto, "paymentMethod" | "creditDays">): string {
  if (supplier.paymentMethod === "credit" && supplier.creditDays) return `آجل ${supplier.creditDays} يوم`;
  return paymentLabels[supplier.paymentMethod];
}

function daysWord(days: number): string {
  if (days === 1) return "يوم";
  if (days === 2) return "يومين";
  return days <= 10 ? "أيام" : "يوم";
}

/** «3 – 5 أيام» / «يومين» / «—» */
export function leadTimeText(supplier: Pick<SupplierDto, "leadTimeMinDays" | "leadTimeMaxDays">): string {
  const { leadTimeMinDays: min, leadTimeMaxDays: max } = supplier;
  if (min === null && max === null) return "—";
  if (min !== null && max !== null && min !== max) return `${min} – ${max} ${daysWord(max)}`;
  const days = (max ?? min) as number;
  return days === 2 ? "يومين" : days === 1 ? "يوم" : `${days} ${daysWord(days)}`;
}

/** عمر أسعار المورد بالأيام، ولو قديمة (أكتر من 60 يوم) */
export function pricesAge(supplier: Pick<SupplierDto, "pricesUpdatedAt">, now: Date = new Date()) {
  const days = daysAgo(new Date(supplier.pricesUpdatedAt), now);
  return { days, stale: days > STALE_PRICES_DAYS };
}

/** «أن» من «الأناضول للأقمشة»: من غير «ال» */
export function supplierInitials(name: string): string {
  const word = name.trim().split(/\s+/)[0] ?? "";
  return (word.startsWith("ال") && word.length > 3 ? word.slice(2) : word).slice(0, 2);
}
