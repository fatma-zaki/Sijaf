/** رابط NestJS؛ بيتقري على السيرفر بس ومش بيوصل للمتصفح */
export function apiBaseUrl(): string {
  const url = process.env.API_BASE_URL;
  if (!url) throw new Error("API_BASE_URL مش متظبط في .env.local");
  return url.replace(/\/$/, "");
}

/** IP العميل من الطلب اللي جاي للـ Next (Vercel بيحط الحقيقي في x-forwarded-for) */
export function clientIpFrom(headers: Headers): string | null {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip");
}

/**
 * كل الطلبات للـ API طالعة من سيرفر Next، فبنبعت IP العميل ومعاه مفتاح سري
 * عشان الـ rate limit يبقى لكل مستخدم مش لسيرفر Next كله.
 */
export function internalHeaders(clientIp: string | null): Record<string, string> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret || !clientIp) return {};
  return { "x-sijaf-client-ip": clientIp, "x-sijaf-internal-key": secret };
}
