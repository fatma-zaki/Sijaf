import type { DashboardDto } from "@sijaf/shared";
import { Camera, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { greeting, NextAppointment, QuoteHero, QuoteStatCards, RecentQuotes, TodayAppointments } from "@/components/features/home/home-sections";
import { SetupChecklist } from "@/components/features/onboarding/setup-checklist";
import { checklist, isStepDone } from "@/components/features/onboarding/steps";
import { PageHeader } from "@/components/layout/page-header";
import { buttonStyles } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { apiRequest } from "@/lib/api/server";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "الرئيسية" };

function appointmentsText(count: number): string {
  if (count === 0) return "مفيش مواعيد النهارده";
  if (count === 1) return "عندك موعد واحد النهارده";
  if (count === 2) return "عندك موعدين النهارده";
  return `عندك ${count} ${count <= 10 ? "مواعيد" : "موعد"} النهارده`;
}

export default async function HomePage() {
  const [{ user, shop }, dashboard] = await Promise.all([getSession(), apiRequest<DashboardDto>("/dashboard")]);
  const pendingSetup = checklist.some((item) => item.id !== "first-quote" && !isStepDone(shop, item.id));
  const showSetup = user.role === "owner" && pendingSetup && !shop.onboardingDismissed;
  const firstName = user.fullName.split(/\s+/)[0];
  const todayCount = dashboard.todayAppointments.length;

  return (
    <>
      <div className="flex items-center justify-between md:hidden">
        <Logo size="sm" className="text-ink" />
      </div>
      <PageHeader
        title={showSetup ? `أهلاً بيك في سِجاف، ${firstName} 👋` : `${greeting()}، ${firstName} 👋`}
        subtitle={
          showSetup ? (
            "خلّينا نجهّز محلك، وبعدها تعمل أول عرض سعر."
          ) : (
            <>
              <span className="md:hidden">{appointmentsText(todayCount)}</span>
              <span className="hidden md:inline">{user.canQuote ? "جاهز لإنشاء عرض سعر جديد؟" : appointmentsText(todayCount)}</span>
            </>
          )
        }
        actions={
          showSetup &&
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
      {showSetup && <SetupChecklist shop={shop} />}
      {!showSetup && user.canQuote && <QuoteHero />}
      {dashboard.quotes && <QuoteStatCards stats={dashboard.quotes} />}
      {dashboard.nextAppointment && <NextAppointment appointment={dashboard.nextAppointment} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-6">
        {dashboard.quotes && <RecentQuotes quotes={dashboard.quotes.recent} />}
        <div className={dashboard.quotes ? "hidden md:block" : undefined}>
          <TodayAppointments appointments={dashboard.todayAppointments} linkSchedule />
        </div>
      </div>
    </>
  );
}
