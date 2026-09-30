import "server-only";
import { zodFieldErrors } from "@sijaf/shared";
import type { z } from "zod";
import { ApiError } from "./api/errors";
import type { ActionResult } from "./action-result";

/**
 * بيعمل validation للمدخلات بنفس الـ schema المشترك قبل ما يكلم الـ API،
 * وبيحوّل أخطاء الـ API لـ ActionResult. أي خطأ تاني (زي redirect) بيعدّي زي ما هو.
 */
export async function runAction<Schema extends z.ZodType, Result = void>(
  schema: Schema,
  input: unknown,
  run: (data: z.output<Schema>) => Promise<Result>,
): Promise<ActionResult<Result>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "راجع البيانات المكتوبة", fieldErrors: zodFieldErrors(parsed.error) };
  }
  try {
    return { ok: true, data: await run(parsed.data) };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, message: error.message, fieldErrors: error.fieldErrors };
    }
    throw error;
  }
}
