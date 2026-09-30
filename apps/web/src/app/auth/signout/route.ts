import { NextResponse, type NextRequest } from "next/server";
import { clearedSessionCookies } from "@/lib/auth/cookies";

/** بيمسح الكوكيز لما الجلسة تبقى مش صالحة وقت رندر صفحة (Server Components مابتقدرش تكتب كوكيز) */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  for (const cookie of clearedSessionCookies()) response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
