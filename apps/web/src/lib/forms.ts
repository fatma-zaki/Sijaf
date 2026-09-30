import type { FieldValues, Path, UseFormReturn, UseFormSetError } from "react-hook-form";
import type { ActionResult } from "./action-result";

/**
 * بيحط أخطاء الـ Server Action على حقول الفورم، والرسالة العامة على root.
 * بيرجّع true لو فيه خطأ.
 */
export function applyActionErrors<Values extends FieldValues, Data>(
  result: ActionResult<Data>,
  setError: UseFormSetError<Values>,
  fields: readonly Path<Values>[],
): result is Extract<ActionResult<Data>, { ok: false }> {
  if (result.ok) return false;
  let assigned = false;
  for (const [key, message] of Object.entries(result.fieldErrors ?? {})) {
    const field = fields.find((name) => name === key);
    if (field) {
      setError(field, { type: "server", message }, { shouldFocus: !assigned });
      assigned = true;
    }
  }
  if (!assigned) setError("root.server", { type: "server", message: result.message });
  return true;
}

/**
 * register + defaultValue: الـ register لوحده مابيحطش قيمة في الـ HTML اللي السيرفر بيرندره،
 * فالحقول بتبان فاضية لحد ما الـ JS يحمّل (واضح على النت الضعيف). ده بيحط القيمة من الأول.
 */
export function withDefault<Values extends FieldValues>(form: UseFormReturn<Values>, name: Path<Values>) {
  const value: unknown = form.getValues(name);
  return {
    ...form.register(name),
    defaultValue: value === null || value === undefined ? undefined : String(value),
  };
}
