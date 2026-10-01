import { z } from "zod";
import type { UserRole } from "./auth.js";
import { mobileSchema } from "./phone.js";

/** خطوات تجهيز المحل بالترتيب، زي شاشة Onboarding */
export const onboardingSteps = ["shop", "prices", "models", "team"] as const;
export type OnboardingStep = (typeof onboardingSteps)[number];

export const onboardingStepLabels: Record<OnboardingStep, string> = {
  shop: "بيانات المحل",
  prices: "الأسعار",
  models: "الموديلات",
  team: "الفريق",
};

export const shopProfileSchema = z.object({
  name: z.string({ error: "اكتب اسم المحل" }).trim().min(2, "اكتب اسم المحل").max(80, "اسم المحل طويل زيادة"),
  whatsapp: mobileSchema,
  address: z.string().trim().max(200, "العنوان طويل زيادة").default(""),
});
export type ShopProfileInput = z.input<typeof shopProfileSchema>;
export type ShopProfileData = z.output<typeof shopProfileSchema>;

export const onboardingStepSchema = z.enum(onboardingSteps);

export type ShopDto = {
  id: string;
  name: string;
  slug: string;
  whatsapp: string | null;
  address: string;
  /** بيتغير مع كل لوجو جديد (للكاش)؛ null لو مفيش */
  logoVersion: string | null;
  completedSteps: OnboardingStep[];
  onboardingDismissed: boolean;
};

export type UserDto = {
  id: string;
  fullName: string;
  phone: string;
  role: UserRole;
  jobTitle: string;
  canQuote: boolean;
  isActive: boolean;
};

export type MeDto = {
  user: UserDto;
  shop: ShopDto;
};
