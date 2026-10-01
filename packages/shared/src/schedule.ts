import { z } from "zod";
import { optionalMobileSchema } from "./phone.js";
import { datePattern, timePattern } from "./time.js";

export const appointmentTypes = ["inspection", "installation", "delivery"] as const;
export type AppointmentType = (typeof appointmentTypes)[number];

export const appointmentTypeLabels: Record<AppointmentType, string> = {
  inspection: "معاينة",
  installation: "تركيب",
  delivery: "تسليم قماش",
};

const optionalUuid = z.union([z.uuid(), z.literal("").transform(() => null), z.null()]).default(null);

export const appointmentSchema = z
  .object({
    type: z.enum(appointmentTypes, { error: "اختار نوع الموعد" }),
    date: z.string({ error: "اختار اليوم" }).regex(datePattern, "اختار اليوم"),
    time: z.string({ error: "اختار الساعة" }).regex(timePattern, "اختار الساعة"),
    technicianId: optionalUuid,
    /** العميل، أو المورد في تسليم القماش */
    clientName: z.string({ error: "اكتب الاسم" }).trim().min(2, "اكتب الاسم").max(80, "الاسم طويل زيادة"),
    clientPhone: optionalMobileSchema,
    address: z.string().trim().max(200, "العنوان طويل زيادة").default(""),
    notes: z.string().trim().max(500, "الملاحظات طويلة زيادة").default(""),
    quoteId: optionalUuid,
  })
  .superRefine((data, ctx) => {
    // المعاينة والتركيب عند العميل: لازم رقمه عشان الفني يكلّمه
    if (data.type !== "delivery" && !data.clientPhone) {
      ctx.addIssue({ code: "custom", path: ["clientPhone"], message: "اكتب موبايل العميل" });
    }
  });
export type AppointmentInput = z.input<typeof appointmentSchema>;
export type AppointmentData = z.output<typeof appointmentSchema>;

export const appointmentListQuerySchema = z.object({
  from: z.string().regex(datePattern),
  /** آخر يوم (داخل في الفترة) */
  to: z.string().regex(datePattern),
  technicianId: z.uuid().optional(),
});
export type AppointmentListQuery = z.input<typeof appointmentListQuerySchema>;
export type AppointmentListQueryData = z.output<typeof appointmentListQuerySchema>;

export type AppointmentDto = {
  id: string;
  type: AppointmentType;
  startsAt: string;
  /** بتوقيت القاهرة */
  date: string;
  time: string;
  title: string;
  clientId: string | null;
  clientPhone: string | null;
  area: string;
  address: string;
  notes: string;
  technician: { id: string; name: string } | null;
  quote: { id: string; number: number } | null;
};
