import "server-only";
import type { PublicQuoteDto } from "@sijaf/shared";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ApiError } from "@/lib/api/errors";
import { apiRequest } from "@/lib/api/server";

/** العرض العام بالتوكن (مرة واحدة للـ metadata والصفحة)؛ رابط غلط أو عرض مش جاهز = 404 */
export const getPublicQuote = cache(async (token: string): Promise<PublicQuoteDto> => {
  try {
    return await apiRequest<PublicQuoteDto>(`/public/quotes/${encodeURIComponent(token)}`, { auth: false });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
});
