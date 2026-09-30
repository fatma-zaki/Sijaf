import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { OnboardingStepLayout } from "@/components/features/onboarding/onboarding-step";
import { PricesStep } from "@/components/features/onboarding/prices-step";

export const metadata: Metadata = { title: "تجهيز المحل · الأسعار" };

export default async function PricesStepPage() {
  const { shop } = await getSession();
  return (
    <OnboardingStepLayout
      step="prices"
      shop={shop}
      title="ضيف أسعار محلك"
      description="كل عرض سعر هيتحسب من الأسعار دي. اختار الطريقة الأسهل ليك."
    >
      <PricesStep />
    </OnboardingStepLayout>
  );
}
