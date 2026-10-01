import { z } from "zod";
import type { Tier } from "./catalog.js";
import type { QuoteListItemDto } from "./quotes.js";
import type { AppointmentDto } from "./schedule.js";

export const reportPeriods = ["week", "month", "quarter", "year"] as const;
export type ReportPeriod = (typeof reportPeriods)[number];

export const reportPeriodLabels: Record<ReportPeriod, string> = {
  week: "هذا الأسبوع",
  month: "هذا الشهر",
  quarter: "آخر 3 شهور",
  year: "السنة",
};

export const reportQuerySchema = z.object({ period: z.enum(reportPeriods).default("month") });
export type ReportQueryData = z.output<typeof reportQuerySchema>;

/** التقارير بتبدأ بعد العدد ده من العروض */
export const REPORTS_MIN_QUOTES = 5;

export type ReportsDto = {
  period: ReportPeriod;
  /** كل عروض المحل (للحالة الفاضية) */
  totalQuotes: number;
  sent: { count: number; value: number };
  accepted: { count: number; value: number; /** من المرسلة 0–100 */ rate: number | null };
  /** من فرق سعر الشراء والبيع في العروض المقبولة */
  expectedProfit: number;
  /** متوسط الفرق بين السعر التقديري والنهائي بعد المعاينة (0–100)، null لو مفيش أسعار نهائية */
  accuracy: number | null;
  /** آخر 6 شهور: «YYYY-MM» */
  monthly: { month: string; count: number }[];
  topMaterials: { name: string; count: number }[];
  /** المستوى في العروض المقبولة */
  tiers: Record<Tier, number>;
  suppliers: { id: string; name: string; quoteCount: number; purchaseValue: number; profit: number; pricesUpdatedAt: string }[];
};

export type DashboardDto = {
  /** null للفني اللي مابيعملش عروض */
  quotes: {
    month: number;
    lastMonth: number;
    today: number;
    yesterday: number;
    acceptedMonth: number;
    acceptedLastMonth: number;
    recent: (QuoteListItemDto & { widthCm: number | null; heightCm: number | null })[];
  } | null;
  /** صاحب المحل بيشوف كل المواعيد، والفني مواعيده بس */
  todayAppointments: AppointmentDto[];
  nextAppointment: AppointmentDto | null;
};
