import { z } from "zod";
import { mobileSchema } from "./phone.js";

/** «عميل متكرر» = عرضين أو أكتر · «عميل جديد» = اتسجل آخر 30 يوم · «محتاج متابعة» = عرض اتبعت من أكتر من 3 أيام ولسه مارد */
export const clientTags = ["followup", "repeat", "new"] as const;
export type ClientTag = (typeof clientTags)[number];

export const clientTagLabels: Record<ClientTag, string> = {
  followup: "محتاج متابعة",
  repeat: "عميل متكرر",
  new: "عميل جديد",
};

/** أسماء الفلاتر (الجمع) */
export const clientSegmentLabels: Record<ClientTag, string> = {
  new: "عملاء جدد",
  repeat: "متكررين",
  followup: "محتاج متابعة",
};

export const NEW_CLIENT_DAYS = 30;
export const FOLLOW_UP_DAYS = 3;

export const clientListQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  segment: z.enum(clientTags).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});
export type ClientListQuery = z.input<typeof clientListQuerySchema>;
export type ClientListQueryData = z.output<typeof clientListQuerySchema>;

export type ClientListItemDto = {
  id: string;
  name: string;
  phone: string;
  area: string;
  quoteCount: number;
  lastQuoteAt: string | null;
  /** مجموع العروض المقبولة */
  acceptedTotal: number;
  tag: ClientTag | null;
};

export type ClientListDto = {
  items: ClientListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  stats: {
    total: number;
    newThisMonth: number;
    newLastMonth: number;
    /** نسبة العملاء اللي ليهم أكتر من عرض (0–100) */
    repeatPercent: number;
  };
};

export const createClientSchema = z.object({
  name: z.string({ error: "اكتب اسم العميل" }).trim().min(2, "اكتب اسم العميل").max(80, "الاسم طويل زيادة"),
  phone: mobileSchema,
  area: z.string().trim().max(80, "المنطقة طويلة زيادة").default(""),
  address: z.string().trim().max(200, "العنوان طويل زيادة").default(""),
});
export type CreateClientInput = z.input<typeof createClientSchema>;
export type CreateClientData = z.output<typeof createClientSchema>;

export type ClientDto = { id: string; name: string; phone: string; area: string; address: string };
