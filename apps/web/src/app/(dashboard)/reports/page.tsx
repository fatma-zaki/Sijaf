import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { requireOwner } from "@/lib/auth/session";

export const metadata: Metadata = { title: "التقارير" };

export default async function Page() {
  await requireOwner();
  return (
    <>
      <PageHeader title="التقارير" backHref="/more" />
      <ComingSoon phase={6} what="تقارير العروض والموردين" />
    </>
  );
}
