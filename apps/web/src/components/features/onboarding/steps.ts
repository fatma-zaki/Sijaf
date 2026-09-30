import { onboardingSteps, type OnboardingStep, type ShopDto } from "@sijaf/shared";

export type ChecklistItem = {
  id: OnboardingStep | "first-quote";
  title: string;
  description: string;
  href: string;
};

/** خطوات «جهّز محلك» في الرئيسية: خطوات الـ onboarding + أول عرض سعر */
export const checklist: readonly ChecklistItem[] = [
  { id: "shop", title: "بيانات المحل", description: "الاسم ورقم واتساب والعنوان", href: "/onboarding/shop" },
  { id: "prices", title: "ضيف أسعار الخامات", description: "استورد شيت Excel أو ابدأ بأسعار نموذجية", href: "/onboarding/prices" },
  { id: "models", title: "راجع الموديلات", description: "8 موديلات جاهزة، عدّل الكشكشة والمصنعية", href: "/onboarding/models" },
  { id: "team", title: "ضيف الفنيين", description: "عشان يعملوا عروض من موبايلاتهم", href: "/onboarding/team" },
  { id: "first-quote", title: "اعمل أول عرض سعر", description: "صوّر ستارة وجرّب بنفسك", href: "/quotes/new" },
];

export function isStepDone(shop: Pick<ShopDto, "completedSteps">, id: ChecklistItem["id"]): boolean {
  return id !== "first-quote" && shop.completedSteps.includes(id);
}

/** أول خطوة onboarding لسه ماخلصتش (أو null لو كلها خلصت) */
export function firstPendingStep(shop: Pick<ShopDto, "completedSteps">): OnboardingStep | null {
  return onboardingSteps.find((step) => !shop.completedSteps.includes(step)) ?? null;
}

export function nextStep(step: OnboardingStep): OnboardingStep | null {
  return onboardingSteps[onboardingSteps.indexOf(step) + 1] ?? null;
}
