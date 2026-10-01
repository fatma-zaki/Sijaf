import type { CurtainModelDto, MaterialPublicDto, QuoteDto } from "@sijaf/shared";
import type { Metadata } from "next";
import { DetailsEditor } from "@/components/features/quotes/details-editor";
import { WizardHeader } from "@/components/features/quotes/wizard-header";
import { apiRequest } from "@/lib/api/server";
import { requireQuoter } from "@/lib/auth/session";

export const metadata: Metadata = { title: "تفاصيل العرض" };

export default async function DetailsPage({ params }: PageProps<"/quotes/[id]/details">) {
  await requireQuoter();
  const { id } = await params;
  const [quote, models, materials] = await Promise.all([
    apiRequest<QuoteDto>(`/quotes/${encodeURIComponent(id)}`),
    apiRequest<CurtainModelDto[]>("/models"),
    apiRequest<MaterialPublicDto[]>("/materials/options"),
  ]);
  return (
    <>
      <WizardHeader step={1} backHref="/" subtitle={`#${quote.number} · ${quote.client.name}`} />
      <DetailsEditor quote={quote} models={models} materials={materials} />
    </>
  );
}
