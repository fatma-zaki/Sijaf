import type { ApiErrorBody } from "@sijaf/shared";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isErrorBody(value: unknown): value is Partial<ApiErrorBody> {
  return typeof value === "object" && value !== null;
}

/** بيحوّل رد الخطأ من NestJS لـ ApiError برسالة عربي */
export async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // الرد مش JSON
  }
  const parsed = isErrorBody(body) ? body : {};
  const message =
    typeof parsed.message === "string" && parsed.message
      ? parsed.message
      : response.status >= 500
        ? "حصلت مشكلة عندنا، جرّب تاني بعد شوية"
        : "الطلب ماتمش";
  return new ApiError(response.status, message, parsed.fieldErrors ?? {});
}
