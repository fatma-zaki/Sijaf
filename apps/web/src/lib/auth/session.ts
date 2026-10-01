import "server-only";
import type { MeDto } from "@sijaf/shared";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { apiRequest } from "../api/server";
import { ApiError } from "../api/errors";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./cookies";

/** المستخدم والمحل للطلب الحالي (مرة واحدة لكل request) */
export const getSession = cache(async (): Promise<MeDto> => {
  try {
    return await apiRequest<MeDto>("/me");
  } catch (error) {
    // التوكن مش صالح (الحساب اتوقف مثلًا): امسح الكوكيز وارجع للدخول
    if (error instanceof ApiError && (error.status === 401 || error.status === 404)) redirect("/auth/signout");
    throw error;
  }
});

/** للصفحات اللي لصاحب المحل بس: الفني بيرجع للرئيسية */
export async function requireOwner(): Promise<MeDto> {
  const session = await getSession();
  if (session.user.role !== "owner") redirect("/");
  return session;
}

/** للصفحات اللي بتعمل عروض أسعار: صاحب المحل وفني المعاينة */
export async function requireQuoter(): Promise<MeDto> {
  const session = await getSession();
  if (!session.user.canQuote) redirect("/");
  return session;
}

/** حد من المحل (مش العميل): فتحه لرابط العرض أو تحميله الـ PDF مايتسجلش في السجل */
export async function hasStaffSession(): Promise<boolean> {
  const jar = await cookies();
  return jar.has(ACCESS_COOKIE) || jar.has(REFRESH_COOKIE);
}
