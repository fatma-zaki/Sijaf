import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { requireOwner } from "@/lib/auth/session";

export const metadata: Metadata = { title: "كتالوج الأسعار" };

export default async function Page() {
  await requireOwner();
  return (
    <>
      <PageHeader title="كتالوج الأسعار" backHref="/more" />
      <ComingSoon phase={3} what="الخامات والموردين والموديلات" />
    </>
  );
}
