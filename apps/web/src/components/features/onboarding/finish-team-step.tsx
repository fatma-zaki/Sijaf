"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeOnboardingStep } from "@/components/features/shop/actions";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

export function FinishTeamStep() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const finish = () =>
    startTransition(async () => {
      const result = await completeOnboardingStep("team");
      if (!result.ok) return setError(result.message);
      router.push("/");
    });

  return (
    <div className="flex flex-col gap-2">
      <FormError message={error} />
      <Button size="lg" onClick={finish} disabled={pending} className="min-w-45">
        {pending ? "لحظة..." : "خلصنا، روح للرئيسية"}
        <Check aria-hidden />
      </Button>
    </div>
  );
}
