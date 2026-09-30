import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";


export const metadata: Metadata = { title: "العملاء" };

export default async function Page() {

  return (
    <>
      <PageHeader title="العملاء" backHref="/more" />
      <ComingSoon phase={6} what="العملاء وعروضهم" />
    </>
  );
}
