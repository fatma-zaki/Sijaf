import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { requireOwner } from "@/lib/auth/session";

/** تجهيز المحل: من غير القايمة الجانبية، زي شاشة Onboarding */
export default async function OnboardingLayout({ children }: LayoutProps<"/onboarding">) {
  await requireOwner();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-4 md:px-12 md:py-5">
        <Logo className="text-ink" />
        <span className="text-xs text-ink-muted">
          <span className="hidden md:inline">تقدر تكمّل بعدين من الإعدادات · </span>
          <Link href="/" className="inline-flex min-h-11 items-center font-semibold">
            تخطي
          </Link>
        </span>
      </header>
      <main className="mx-auto flex w-full max-w-260 grow flex-col gap-5.5 px-4 py-5 md:py-7">{children}</main>
    </div>
  );
}
