"use server";

import {
  createQuoteSchema,
  quoteDetailsSchema,
  quotePricingSchema,
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
