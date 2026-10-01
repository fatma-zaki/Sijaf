import type { PricingContextDto, QuoteDto } from "@sijaf/shared";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PricingEditor } from "@/components/features/quotes/pricing-editor";
import { WizardHeader } from "@/components/features/quotes/wizard-header";
import { apiRequest } from "@/lib/api/server";
import { requireQuoter } from "@/lib/auth/session";

export const metadata: Metadata = { title: "اختر مستوى العرض" };

export default async function PricingPage({ params }: PageProps<"/quotes/[id]/pricing">) {
  await requireQuoter();
  const { id } = await params;
  const quote = await apiRequest<QuoteDto>(`/quotes/${encodeURIComponent(id)}`);
  // من غير موديل ومقاسات مفيش حاجة تتسعّر
  if (!quote.modelId || !quote.widthCm || !quote.heightCm) redirect(`/quotes/${quote.id}/details`);
  const context = await apiRequest<PricingContextDto>(`/quotes/${quote.id}/pricing-context`);

  return (
    <>
      <WizardHeader step={2} title="اختر مستوى العرض" backHref={`/quotes/${quote.id}/details`} subtitle={`#${quote.number} · ${quote.client.name}`} />
      <PricingEditor quoteId={quote.id} context={context} />
    </>
  );
}
