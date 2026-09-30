import { BottomNav } from "@/components/layout/bottom-nav";
import { IconRail } from "@/components/layout/icon-rail";
import { Sidebar } from "@/components/layout/sidebar";
import { getSession } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const { user } = await getSession();
  return (
    <div className="min-h-dvh md:flex">
      <Sidebar user={user} />
      <IconRail user={user} />
      <main className="flex min-w-0 flex-1 flex-col gap-4 px-4 pb-28 pt-4 md:gap-4.5 md:px-6 md:py-5 lg:gap-6 lg:px-8 lg:py-6">
        {children}
      </main>
      <BottomNav user={user} />
    </div>
  );
}
