import type { AuthTokens } from "@sijaf/shared";
import { NextResponse, type NextRequest } from "next/server";
import { apiBaseUrl, clientIpFrom, internalHeaders } from "./lib/api/config";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REMEMBER_COOKIE,
  clearedSessionCookies,
  sessionCookies,
  type SessionCookie,
} from "./lib/auth/cookies";
import { decideAuth, isAuthPage } from "./lib/auth/routes";

async function refreshTokens(refreshToken: string, clientIp: string | null): Promise<AuthTokens | null> {
  try {
    const response = await fetch(`${apiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...internalHeaders(clientIp) },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    return response.ok ? ((await response.json()) as AuthTokens) : null;
  } catch {
    return null;
  }
}

function withCookies(response: NextResponse, cookies: SessionCookie[]): NextResponse {
  for (const cookie of cookies) response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}

function toLogin(request: NextRequest): NextResponse {
  const url = new URL("/login", request.url);
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (next !== "/") url.searchParams.set("next", next);
  return withCookies(NextResponse.redirect(url), clearedSessionCookies());
}

/**
 * بيحمي الصفحات، ولو الـ access token خلص بيجدده بالـ refresh token
 * قبل ما الصفحة تترندر، عشان الـ Server Components تلاقي توكن صالح.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const decision = decideAuth(pathname, {
    access: request.cookies.has(ACCESS_COOKIE),
    refresh: request.cookies.has(REFRESH_COOKIE),
  });

  if (decision === "allow") return NextResponse.next();
  if (decision === "to-home") return NextResponse.redirect(new URL("/", request.url));
  if (decision === "to-login") return toLogin(request);

  const tokens = await refreshTokens(request.cookies.get(REFRESH_COOKIE)?.value ?? "", clientIpFrom(request.headers));
  if (!tokens) {
    return isAuthPage(pathname)
      ? withCookies(NextResponse.next(), clearedSessionCookies())
      : toLogin(request);
  }

  const cookies = sessionCookies(tokens, request.cookies.get(REMEMBER_COOKIE)?.value !== "0");
  if (isAuthPage(pathname)) return withCookies(NextResponse.redirect(new URL("/", request.url)), cookies);

  // الكوكيز الجديدة لازم توصل للصفحة في نفس الطلب، مش في اللي بعده بس
  for (const cookie of cookies) request.cookies.set(cookie.name, cookie.value);
  return withCookies(NextResponse.next({ request: { headers: request.headers } }), cookies);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|fonts/).*)"],
};
