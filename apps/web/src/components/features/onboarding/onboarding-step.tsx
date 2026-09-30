import { onboardingStepLabels, onboardingSteps, type OnboardingStep, type ShopDto } from "@sijaf/shared";
import type { ReactNode } from "react";
import { Stepper } from "@/components/ui/stepper";

const labels = onboardingSteps.map((step) => onboardingStepLabels[step]);

type OnboardingStepProps = {
  step: OnboardingStep;
  shop: Pick<ShopDto, "completedSteps">;
  title: string;
  description: string;
  children: ReactNode;
};

/** هيكل كل خطوة: الـ stepper في كارت، وتحته العنوان والمحتوى */
export function OnboardingStepLayout({ step, shop, title, description, children }: OnboardingStepProps) {
  const index = onboardingSteps.indexOf(step);
  const completed = onboardingSteps.map((item) => shop.completedSteps.includes(item));
  return (
    <>
      <div className="rounded-lg border border-border bg-surface px-4 py-3 shadow-card md:px-6 md:py-4">
        <Stepper label="خطوات تجهيز المحل" steps={labels} current={index} completed={completed} />
        <p className="m-0 mt-2 text-xs text-ink-muted md:hidden">
          خطوة {index + 1} من {onboardingSteps.length} · {labels[index]}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-title font-bold text-ink">{title}</h1>
        <p className="m-0 text-ink-muted">{description}</p>
      </div>
      {children}
    </>
  );
}
