import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { requireQuoter } from "@/lib/auth/session";

export const metadata: Metadata = { title: "عروض الأسعار" };

export default async function Page() {
  await requireQuoter();
  return (
    <>
      <PageHeader title="عروض الأسعار" />
      <ComingSoon phase={5} what="قايمة العروض وحالاتها" />
    </>
  );
}
