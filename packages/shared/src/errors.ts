import type { z } from "zod";

/** شكل الخطأ اللي الـ API بيرجّعه دايمًا */
export type ApiErrorBody = {
  statusCode: number;
  message: string;
  /** أخطاء الحقول: path ← رسالة */
  fieldErrors?: Record<string, string>;
};

/** أول رسالة لكل حقل، بمفتاح زي «phone» أو «items.0.price» */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_";
    result[key] ??= issue.message;
  }
  return result;
}
