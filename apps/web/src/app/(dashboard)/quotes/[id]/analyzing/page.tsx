import type { QuoteDto } from "@sijaf/shared";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AnalyzingView } from "@/components/features/quotes/analyzing-view";
import { WizardHeader } from "@/components/features/quotes/wizard-header";
import { apiRequest } from "@/lib/api/server";
import { requireQuoter } from "@/lib/auth/session";

export const metadata: Metadata = { title: "تحليل الصورة" };

export default async function AnalyzingPage({ params, searchParams }: PageProps<"/quotes/[id]/analyzing">) {
  await requireQuoter();
  const [{ id }, { retry }] = await Promise.all([params, searchParams]);
  const quote = await apiRequest<QuoteDto>(`/quotes/${encodeURIComponent(id)}`);
  if (quote.photoCount === 0) redirect(`/quotes/${quote.id}/details`);

  // التحليل اللي نجح قبل كده مايتعادش إلا لو المستخدم طلب
  const previous = retry ? null : (quote.analysis?.status ?? null);
  if (previous === "ok") redirect(`/quotes/${quote.id}/details`);

  return (
    <>
      <WizardHeader step={0} backHref="/quotes/new" subtitle={`#${quote.number} · ${quote.client.name}`} />
      <AnalyzingView quote={quote} initialStatus={previous} />
    </>
  );
}
