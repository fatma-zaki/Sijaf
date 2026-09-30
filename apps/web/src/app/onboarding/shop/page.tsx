import type { Metadata } from "next";
import { OnboardingStepLayout } from "@/components/features/onboarding/onboarding-step";
import { ShopStepForm } from "@/components/features/onboarding/shop-step-form";
import { Card } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "تجهيز المحل · بيانات المحل" };

export default async function ShopStepPage() {
  const { shop } = await getSession();
  return (
    <OnboardingStepLayout
      step="shop"
      shop={shop}
      title="بيانات محلك"
      description="الاسم ورقم الواتساب بيظهروا للعميل على عرض السعر."
    >
      <Card className="md:max-w-160">
        <ShopStepForm shop={shop} />
      </Card>
    </OnboardingStepLayout>
  );
}
