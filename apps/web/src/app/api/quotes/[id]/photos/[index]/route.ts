import type { NextRequest } from "next/server";
import { proxyImage } from "@/lib/api/image-proxy";

/** صورة العرض (خاصة): بتعدّي من Next بتوكن المستخدم */
export async function GET(_request: NextRequest, { params }: RouteContext<"/api/quotes/[id]/photos/[index]">) {
  const { id, index } = await params;
  return proxyImage(`/quotes/${encodeURIComponent(id)}/photos/${encodeURIComponent(index)}`, {
    auth: true,
    cacheControl: "private, max-age=3600",
  });
}
