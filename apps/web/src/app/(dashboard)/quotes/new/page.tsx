import type { Metadata } from "next";
import { NewQuoteForm } from "@/components/features/quotes/new-quote-form";
import { WizardHeader } from "@/components/features/quotes/wizard-header";
import { requireQuoter } from "@/lib/auth/session";

export const metadata: Metadata = { title: "عرض سعر جديد" };

export default async function NewQuotePage() {
  await requireQuoter();
  return (
    <>
      <WizardHeader step={0} backHref="/" />
      <NewQuoteForm />
    </>
  );
}
