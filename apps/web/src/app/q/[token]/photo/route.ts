import type { NextRequest } from "next/server";
import { proxyImage } from "@/lib/api/image-proxy";

/** صورة الستارة في صفحة العميل (وصورة المعاينة في واتساب) */
export async function GET(_request: NextRequest, { params }: RouteContext<"/q/[token]/photo">) {
  const { token } = await params;
  return proxyImage(`/public/quotes/${encodeURIComponent(token)}/photo`, { auth: false, cacheControl: "public, max-age=3600" });
}
