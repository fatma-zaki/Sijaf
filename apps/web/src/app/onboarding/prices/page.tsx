import type { CatalogCountsDto } from "@sijaf/shared";
import type { Metadata } from "next";
import { OnboardingStepLayout } from "@/components/features/onboarding/onboarding-step";
import { PricesStep } from "@/components/features/onboarding/prices-step";
import { apiRequest } from "@/lib/api/server";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "تجهيز المحل · الأسعار" };

export default async function PricesStepPage() {
  const [{ shop }, counts] = await Promise.all([getSession(), apiRequest<CatalogCountsDto>("/catalog/counts")]);
  return (
    <OnboardingStepLayout
      step="prices"
      shop={shop}
      title="ضيف أسعار محلك"
      description="كل عرض سعر هيتحسب من الأسعار دي. اختار الطريقة الأسهل ليك."
    >
      <PricesStep materialsCount={counts.materials} />
    </OnboardingStepLayout>
  );
}
