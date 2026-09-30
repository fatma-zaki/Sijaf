import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { requireQuoter } from "@/lib/auth/session";

export const metadata: Metadata = { title: "إنشاء عرض سعر جديد" };

export default async function Page() {
  await requireQuoter();
  return (
    <>
      <PageHeader title="إنشاء عرض سعر جديد" backHref="/" />
      <ComingSoon phase={4} what="رفع الصورة وتحليلها وحساب التلات مستويات" />
    </>
  );
}
