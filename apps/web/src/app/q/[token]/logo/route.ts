import type { NextRequest } from "next/server";
import { proxyImage } from "@/lib/api/image-proxy";

/** لوجو المحل في صفحة العميل */
export async function GET(_request: NextRequest, { params }: RouteContext<"/q/[token]/logo">) {
  const { token } = await params;
  return proxyImage(`/public/quotes/${encodeURIComponent(token)}/logo`, { auth: false, cacheControl: "public, max-age=86400" });
}
