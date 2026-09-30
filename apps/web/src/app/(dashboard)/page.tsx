import { Camera, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SetupChecklist } from "@/components/features/onboarding/setup-checklist";
import { checklist, isStepDone } from "@/components/features/onboarding/steps";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { buttonStyles } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "الرئيسية" };

export default async function HomePage() {
  const { user, shop } = await getSession();
  const pendingSetup = checklist.some((item) => item.id !== "first-quote" && !isStepDone(shop, item.id));
  const showSetup = user.role === "owner" && pendingSetup && !shop.onboardingDismissed;

  return (
    <>
      <div className="flex items-center justify-between md:hidden">
        <Logo size="sm" className="text-ink" />
      </div>
      <PageHeader
        title={`أهلاً بيك، ${user.fullName} 👋`}
        subtitle={showSetup ? "خلّينا نجهّز محلك، وبعدها تعمل أول عرض سعر." : "جاهز لإنشاء عرض سعر جديد؟"}
        actions={
          user.canQuote && (
            <Link href="/quotes/new" className={buttonStyles({ size: "lg", className: "hidden md:inline-flex" })}>
              عرض سعر جديد
              <Plus aria-hidden />
            </Link>
          )
        }
      />
      {user.canQuote && (
        <Link href="/quotes/new" className={buttonStyles({ size: "lg", block: true, className: "h-13 text-md md:hidden" })}>
          صوّر وسعّر ستارة
          <Camera aria-hidden />
        </Link>
      )}
      {showSetup ? <SetupChecklist shop={shop} /> : <ComingSoon phase={6} what="إحصائيات اليوم وآخر العروض والمواعيد" />}
    </>
  );
}
