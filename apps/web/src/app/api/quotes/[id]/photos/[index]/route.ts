import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { apiFetch } from "@/lib/api/server";

/** صورة العرض (خاصة): بتعدّي من Next بتوكن المستخدم */
export async function GET(_request: NextRequest, { params }: RouteContext<"/api/quotes/[id]/photos/[index]">) {
  const { id, index } = await params;
  try {
    const response = await apiFetch(`/quotes/${encodeURIComponent(id)}/photos/${encodeURIComponent(index)}`);
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    if (error instanceof ApiError) return new NextResponse(null, { status: error.status });
    throw error;
  }
}
