import "server-only";
import { NextResponse } from "next/server";
import { ApiError } from "./errors";
import { apiFetch } from "./server";

/**
 * صورة من الـ API بتعدّي من Next (المتصفح مابيكلمش الـ API مباشرة).
 * الصور الخاصة بتوكن المستخدم؛ صور صفحة العميل من غير توكن.
 */
export async function proxyImage(path: string, { auth, cacheControl }: { auth: boolean; cacheControl: string }): Promise<NextResponse> {
  try {
    const response = await apiFetch(path, { auth });
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": cacheControl,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) return new NextResponse(null, { status: error.status });
    throw error;
  }
}
