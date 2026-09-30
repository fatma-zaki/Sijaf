import "server-only";
import { cookies, headers } from "next/headers";
import { ACCESS_COOKIE } from "../auth/cookies";
import { apiBaseUrl, clientIpFrom, internalHeaders } from "./config";
import { ApiError, toApiError } from "./errors";

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** false للـ endpoints اللي من غير تسجيل دخول (login, register) */
  auth?: boolean;
};

/**
 * بينادي NestJS من السيرفر بتوكن المستخدم اللي في الكوكي،
 * ومعاه IP العميل عشان الـ rate limit (شوف internalHeaders).
 */
export async function apiRequest<T>(path: string, { method = "GET", body, auth = true }: ApiRequestOptions = {}): Promise<T> {
  const requestHeaders = new Headers({ Accept: "application/json" });
  if (body !== undefined) requestHeaders.set("Content-Type", "application/json");

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
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    console.error(`[api] ${method} ${path} failed:`, error instanceof Error ? (error.cause ?? error.message) : error);
    throw new ApiError(503, "مش قادرين نوصل للسيرفر، اتأكد من النت وجرّب تاني");
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
