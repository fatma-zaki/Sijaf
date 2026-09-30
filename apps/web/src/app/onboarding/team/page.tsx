import type { UserDto } from "@sijaf/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { FinishTeamStep } from "@/components/features/onboarding/finish-team-step";
import { getSession } from "@/lib/auth/session";
import { OnboardingStepLayout } from "@/components/features/onboarding/onboarding-step";
import { AddTechnicianForm } from "@/components/features/shop/add-technician-form";
import { TeamList } from "@/components/features/shop/team-list";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api/server";

export const metadata: Metadata = { title: "تجهيز المحل · الفريق" };

export default async function TeamStepPage() {
  const { shop } = await getSession();
  const users = await apiRequest<UserDto[]>("/users");
  return (
    <OnboardingStepLayout
      step="team"
      shop={shop}
      title="ضيف الفنيين"
      description="كل فني بيدخل من موبايله برقمه. فني المعاينة بيعمل عروض، وفني التركيب بيشوف مواعيده بس."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr] lg:gap-6">
        <Card className="flex flex-col gap-4">
          <CardTitle>فني جديد</CardTitle>
          <AddTechnicianForm />
        </Card>
        <Card className="flex flex-col gap-2">
          <CardTitle>الفريق</CardTitle>
          <TeamList users={users} />
        </Card>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3">
        <FinishTeamStep />
        <Link href="/onboarding/models" className={buttonStyles({ variant: "secondary", size: "lg" })}>
          رجوع
        </Link>
      </div>
    </OnboardingStepLayout>
  );
}
