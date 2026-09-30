import type { CurtainModelDto } from "@sijaf/shared";
import type { Metadata } from "next";
import { AddDefaultModels } from "@/components/features/catalog/models/add-default-models";
import { ModelsStep } from "@/components/features/onboarding/models-step";
import { OnboardingStepLayout } from "@/components/features/onboarding/onboarding-step";
import { apiRequest } from "@/lib/api/server";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "تجهيز المحل · الموديلات" };

export default async function ModelsStepPage() {
  const [{ shop }, models] = await Promise.all([getSession(), apiRequest<CurtainModelDto[]>("/models")]);
  return (
    <OnboardingStepLayout
      step="models"
      shop={shop}
      title="راجع الموديلات"
      description="دي الموديلات اللي بتشتغلها. راجع معامل الكشكشة والمصنعية، وعدّل أي موديل من الكتالوج."
    >
      {models.length > 0 ? <ModelsStep models={models} /> : <AddDefaultModels />}
    </OnboardingStepLayout>
  );
}
