import type { PublicQuoteDto } from "@sijaf/shared";
import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { apiFetch, apiRequest } from "@/lib/api/server";
import { hasStaffSession } from "@/lib/auth/session";
import { renderPdf } from "@/lib/pdf";

export const maxDuration = 30;

/** PDF العرض: نفس صفحة الطباعة متحوّلة على السيرفر، فشكله زي الصفحة بالظبط */
export async function GET(request: NextRequest, { params }: RouteContext<"/q/[token]/pdf">) {
  const { token } = await params;
  const path = `/public/quotes/${encodeURIComponent(token)}`;
  let quote: PublicQuoteDto;
  try {
    quote = await apiRequest<PublicQuoteDto>(path, { auth: false });
  } catch (error) {
    if (error instanceof ApiError) return new NextResponse(error.message, { status: error.status });
    throw error;
  }

  let pdf: Uint8Array;
  try {
    pdf = await renderPdf(new URL(`/q/${encodeURIComponent(token)}/print`, request.nextUrl.origin).toString());
  } catch (error) {
    console.error("[pdf] render failed:", error);
    return new NextResponse("معرفناش نجهّز الـ PDF دلوقتي، جرّب تاني بعد شوية", { status: 503 });
  }

  if (!(await hasStaffSession())) {
    await apiFetch(`${path}/pdf-downloaded`, { method: "POST", auth: false }).catch(() => undefined);
  }
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="quote-${quote.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
