import "server-only";
import { cookies, headers } from "next/headers";
import { ACCESS_COOKIE } from "../auth/cookies";
import { apiBaseUrl, clientIpFrom, internalHeaders } from "./config";
import { ApiError, toApiError } from "./errors";

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type FetchOptions = {
  method?: Method;
  /** JSON string أو FormData (رفع صورة) */
  body?: BodyInit;
  contentType?: string;
  /** false للـ endpoints اللي من غير تسجيل دخول (login, register) */
  auth?: boolean;
};

/**
 * طلب للـ API بتوكن المستخدم اللي في الكوكي، ومعاه IP العميل للـ rate limit (شوف internalHeaders).
 * بيرجّع الرد الخام (للصور)، والخطأ بيتحول لـ ApiError برسالة عربي.
 */
export async function apiFetch(path: string, { method = "GET", body, contentType, auth = true }: FetchOptions = {}): Promise<Response> {
  const requestHeaders = new Headers({ Accept: "application/json" });
  if (contentType) requestHeaders.set("Content-Type", contentType);
  for (const [name, value] of Object.entries(internalHeaders(clientIpFrom(await headers())))) {
    requestHeaders.set(name, value);
  }
  if (auth) {
    const token = (await cookies()).get(ACCESS_COOKIE)?.value;
    if (!token) throw new ApiError(401, "سجّل دخولك الأول");
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  // برا الـ try: غلطة إعدادات لازم تبان كده، مش كأنها النت فاصل
  const url = `${apiBaseUrl()}${path}`;
  let response: Response;
  try {
    response = await fetch(url, { method, headers: requestHeaders, body, cache: "no-store" });
  } catch (error) {
    console.error(`[api] ${method} ${path} failed:`, error instanceof Error ? (error.cause ?? error.message) : error);
    throw new ApiError(503, "مش قادرين نوصل للسيرفر، اتأكد من النت وجرّب تاني");
  }
  if (!response.ok) throw await toApiError(response);
  return response;
}

/** نفس apiFetch بس بيبعت ويستقبل JSON */
export async function apiRequest<T>(
  path: string,
  { method = "GET", body, auth = true }: { method?: Method; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const response = await apiFetch(path, {
    method,
    auth,
    ...(body === undefined ? {} : { body: JSON.stringify(body), contentType: "application/json" }),
  });
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
