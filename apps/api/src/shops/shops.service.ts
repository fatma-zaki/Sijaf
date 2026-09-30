import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { MeDto, OnboardingStep, ShopDto, ShopProfileData } from '@sijaf/shared';
import { and, eq, sql } from 'drizzle-orm';
import { toShopDto, toUserDto } from '../common/dto.js';
import { DB, type Db } from '../db/db.module.js';
import { shops, users } from '../db/schema.js';

@Injectable()
export class ShopsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async me(userId: string, shopId: string): Promise<MeDto> {
    const [row] = await this.db
      .select({ user: users, shop: shops })
      .from(users)
      .innerJoin(shops, eq(shops.id, users.shopId))
      .where(and(eq(users.id, userId), eq(users.shopId, shopId)))
      .limit(1);
    if (!row) throw new NotFoundException('الحساب مش موجود');
    return { user: toUserDto(row.user), shop: toShopDto(row.shop) };
  }

  async updateProfile(shopId: string, data: ShopProfileData): Promise<ShopDto> {
    const [shop] = await this.db
      .update(shops)
      .set({ name: data.name, whatsapp: data.whatsapp, address: data.address })
      .where(eq(shops.id, shopId))
      .returning();
    if (!shop) throw new NotFoundException('المحل مش موجود');
    return this.completeStep(shopId, 'shop');
  }

  /** بيضيف الخطوة لو مش موجودة (idempotent) */
  async completeStep(shopId: string, step: OnboardingStep): Promise<ShopDto> {
    const [shop] = await this.db
      .update(shops)
      .set({
        completedSteps: sql`case when ${step} = any(${shops.completedSteps}) then ${shops.completedSteps} else array_append(${shops.completedSteps}, ${step}) end`,
      })
      .where(eq(shops.id, shopId))
      .returning();
    if (!shop) throw new NotFoundException('المحل مش موجود');
    return toShopDto(shop);
  }

  async dismissOnboarding(shopId: string): Promise<ShopDto> {
    const [shop] = await this.db
      .update(shops)
      .set({ onboardingDismissed: true })
      .where(eq(shops.id, shopId))
      .returning();
    if (!shop) throw new NotFoundException('المحل مش موجود');
    return toShopDto(shop);
  }
}
