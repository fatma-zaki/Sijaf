import { NextResponse, type NextRequest } from "next/server";
import { apiFetch } from "@/lib/api/server";
import { hasStaffSession } from "@/lib/auth/session";

/**
 * «العميل فتح رابط العرض»: الصفحة بتبعته من المتصفح بعد ما تفتح،
 * فمعاينة الرابط في واتساب (من غير JavaScript) مابتتحسبش، ولا فتح حد من المحل.
 */
export async function POST(_request: NextRequest, { params }: RouteContext<"/q/[token]/opened">) {
  const { token } = await params;
  if (!(await hasStaffSession())) {
    // التسجيل مش أهم من الصفحة: أي خطأ هنا بيتساب
    await apiFetch(`/public/quotes/${encodeURIComponent(token)}/opened`, { method: "POST", auth: false }).catch(() => undefined);
  }
  return new NextResponse(null, { status: 204 });
}
