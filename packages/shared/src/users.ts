import { z } from "zod";
import { passwordSchema } from "./auth.js";
import { mobileSchema } from "./phone.js";

/** صاحب المحل بيضيف الفني بكلمة سر مبدئية ويبعتهاله */
export const createTechnicianSchema = z.object({
  fullName: z.string({ error: "اكتب اسم الفني" }).trim().min(2, "اكتب اسم الفني").max(80, "الاسم طويل زيادة"),
  phone: mobileSchema,
  password: passwordSchema,
  jobTitle: z.string().trim().max(40, "المسمى طويل زيادة").default("فني"),
  /** فني المعاينة بيعمل عروض، فني التركيب بيشوف المواعيد بس */
  canQuote: z.boolean().default(false),
});
export type CreateTechnicianInput = z.input<typeof createTechnicianSchema>;
export type CreateTechnicianData = z.output<typeof createTechnicianSchema>;

export const updateTechnicianSchema = z
  .object({
    fullName: createTechnicianSchema.shape.fullName,
    jobTitle: createTechnicianSchema.shape.jobTitle,
    canQuote: z.boolean(),
    isActive: z.boolean(),
  })
  .partial();
export type UpdateTechnicianInput = z.input<typeof updateTechnicianSchema>;
