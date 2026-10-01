"use server";

import {
  createQuoteSchema,
  quoteDetailsSchema,
  quotePricingSchema,
  updateQuoteSchema,
  type AnalyzeResultDto,
  type QuoteDto,
} from "@sijaf/shared";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction } from "@/lib/actions";
import type { ActionResult } from "@/lib/action-result";
import { apiRequest } from "@/lib/api/server";

const quoteId = z.uuid();

export async function createQuote(input: unknown): Promise<ActionResult<QuoteDto>> {
  return runAction(createQuoteSchema, input, (data) => apiRequest<QuoteDto>("/quotes", { method: "POST", body: data }));
}

export async function analyzeQuote(id: string): Promise<ActionResult<AnalyzeResultDto>> {
  return runAction(quoteId, id, (target) => apiRequest<AnalyzeResultDto>(`/quotes/${target}/analyze`, { method: "POST" }));
}

export async function saveQuoteDetails(id: string, input: unknown): Promise<ActionResult<QuoteDto>> {
  const target = quoteId.parse(id);
  const result = await runAction(quoteDetailsSchema, input, (data) =>
    apiRequest<QuoteDto>(`/quotes/${target}/details`, { method: "PUT", body: data }),
  );
  if (result.ok) revalidatePath(`/quotes/${target}`, "layout");
  return result;
}

export async function saveQuotePricing(id: string, input: unknown): Promise<ActionResult<QuoteDto>> {
  const target = quoteId.parse(id);
  const result = await runAction(quotePricingSchema, input, (data) =>
    apiRequest<QuoteDto>(`/quotes/${target}/pricing`, { method: "PUT", body: data }),
  );
  if (result.ok) revalidatePath(`/quotes/${target}`, "layout");
  return result;
}

export async function updateQuote(id: string, input: unknown): Promise<ActionResult<QuoteDto>> {
  const target = quoteId.parse(id);
  const result = await runAction(updateQuoteSchema, input, (data) => apiRequest<QuoteDto>(`/quotes/${target}`, { method: "PATCH", body: data }));
  if (result.ok) revalidatePath("/quotes", "layout");
  return result;
}

/** بيتنده لما زرار واتساب يتداس (الرسالة نفسها بتتبعت من موبايل المستخدم) */
export async function markQuoteSent(id: string): Promise<ActionResult<QuoteDto>> {
  const result = await runAction(quoteId, id, (target) => apiRequest<QuoteDto>(`/quotes/${target}/sent`, { method: "POST" }));
  if (result.ok) revalidatePath("/quotes", "layout");
  return result;
}

export async function duplicateQuote(id: string): Promise<ActionResult<QuoteDto>> {
  const result = await runAction(quoteId, id, (target) => apiRequest<QuoteDto>(`/quotes/${target}/duplicate`, { method: "POST" }));
  if (result.ok) revalidatePath("/quotes");
  return result;
}
