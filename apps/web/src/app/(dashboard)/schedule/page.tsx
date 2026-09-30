import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";


export const metadata: Metadata = { title: "المواعيد" };

export default async function Page() {

  return (
    <>
      <PageHeader title="المواعيد" />
      <ComingSoon phase={6} what="مواعيد المعاينة والتركيب" />
    </>
  );
}
