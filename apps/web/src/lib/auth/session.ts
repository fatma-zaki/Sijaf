import "server-only";
import type { MeDto } from "@sijaf/shared";
import { redirect } from "next/navigation";
import { cache } from "react";
import { apiRequest } from "../api/server";
import { ApiError } from "../api/errors";

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
