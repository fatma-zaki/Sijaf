import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { apiFetch } from "@/lib/api/server";

/**
 * رفع صورة العرض: المتصفح بيبعتها هنا (مش للـ API مباشرة) وNext بيوصّلها بتوكن المستخدم.
 * Server Actions مش مناسبة للملفات (حد 1MB وبتتحمّل كلها في الذاكرة مرتين).
 */
export async function POST(request: NextRequest, { params }: RouteContext<"/api/quotes/[id]/photos">) {
  const { id } = await params;
  try {
    const form = await request.formData();
    const response = await apiFetch(`/quotes/${encodeURIComponent(id)}/photos`, { method: "POST", body: form });
    return NextResponse.json(await response.json(), { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ message: error.message }, { status: error.status });
    throw error;
  }
}
