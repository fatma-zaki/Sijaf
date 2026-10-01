import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api/errors";
import { proxyImage } from "@/lib/api/image-proxy";
import { apiFetch } from "@/lib/api/server";

/** لوجو المحل؛ الرابط فيه ?v=<logoVersion> فالكاش بيتجدد مع كل لوجو جديد */
export async function GET() {
  return proxyImage("/shop/logo", { auth: true, cacheControl: "private, max-age=86400" });
}

/** رفع لوجو جديد (لصاحب المحل): ملف، فمش Server Action */
export async function POST(request: NextRequest) {
  try {
    const response = await apiFetch("/shop/logo", { method: "POST", body: await request.formData() });
    revalidatePath("/", "layout");
    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ message: error.message }, { status: error.status });
    throw error;
  }
}

export async function DELETE() {
  try {
    const response = await apiFetch("/shop/logo", { method: "DELETE" });
    revalidatePath("/", "layout");
    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ message: error.message }, { status: error.status });
    throw error;
  }
}
