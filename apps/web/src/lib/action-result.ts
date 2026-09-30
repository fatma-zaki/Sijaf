/** نتيجة أي Server Action: نجاح بداتا، أو رسالة وأخطاء حقول */
export type ActionResult<Data = void> =
  | { ok: true; data: Data }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };
