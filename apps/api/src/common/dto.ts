import { onboardingSteps, type OnboardingStep, type ShopDto, type UserDto } from '@sijaf/shared';
import type { ShopRow, UserRow } from '../db/schema.js';

/** الـ password hash وأي حاجة داخلية مابتطلعش برا الـ API */
export function toUserDto(row: UserRow): UserDto {
  return {
    id: row.id,
    fullName: row.fullName,
    phone: row.phone,
    role: row.role,
    jobTitle: row.jobTitle,
    canQuote: row.role === 'owner' || row.canQuote,
    isActive: row.isActive,
  };
}

export function toShopDto(row: ShopRow): ShopDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    whatsapp: row.whatsapp,
    address: row.address,
    logoUrl: null,
    completedSteps: row.completedSteps.filter((step): step is OnboardingStep =>
      (onboardingSteps as readonly string[]).includes(step),
    ),
    onboardingDismissed: row.onboardingDismissed,
  };
}
