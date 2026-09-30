import { redirect } from "next/navigation";
import { firstPendingStep } from "@/components/features/onboarding/steps";
import { getSession } from "@/lib/auth/session";

export default async function OnboardingIndex() {
  const { shop } = await getSession();
  const step = firstPendingStep(shop);
  redirect(step ? `/onboarding/${step}` : "/");
}
