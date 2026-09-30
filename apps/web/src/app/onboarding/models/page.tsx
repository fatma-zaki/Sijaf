import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { OnboardingStepLayout } from "@/components/features/onboarding/onboarding-step";
import { buttonStyles } from "@/components/ui/button";
import { InfoNote } from "@/components/ui/info-note";

export const metadata: Metadata = { title: "تجهيز المحل · الموديلات" };

export default async function ModelsStepPage() {
  const { shop } = await getSession();
  return (
    <OnboardingStepLayout
      step="models"
      shop={shop}
      title="راجع الموديلات"
      description="8 موديلات جاهزة (كسرات، حلقات، ويفي، رومانية…). عدّل معامل الكشكشة والمصنعية لأسعار محلك."
    >
      <InfoNote>مراجعة الموديلات وتعديلها جاية مع الكتالوج في المرحلة 3. تقدر تكمّل دلوقتي وترجعلها من الرئيسية.</InfoNote>
      <div className="mt-auto flex items-center justify-between gap-3">
        <Link href="/onboarding/team" className={buttonStyles({ size: "lg", className: "min-w-45" })}>
          متابعة
          <ChevronLeft aria-hidden />
        </Link>
        <Link href="/onboarding/prices" className={buttonStyles({ variant: "secondary", size: "lg" })}>
          رجوع
        </Link>
      </div>
    </OnboardingStepLayout>
  );
}
