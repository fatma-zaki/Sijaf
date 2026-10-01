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

/** «shopId/logo-<uuid>.png» ← «<uuid>» */
function logoVersion(logoPath: string | null): string | null {
  return logoPath?.match(/logo-([\w-]+)\.\w+$/)?.[1] ?? null;
}

export function toShopDto(row: ShopRow): ShopDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    whatsapp: row.whatsapp,
    address: row.address,
    logoVersion: logoVersion(row.logoPath),
    completedSteps: row.completedSteps.filter((step): step is OnboardingStep =>
      (onboardingSteps as readonly string[]).includes(step),
    ),
    onboardingDismissed: row.onboardingDismissed,
  };
}
