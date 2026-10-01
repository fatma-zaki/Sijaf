import { randomUUID } from 'node:crypto';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { MeDto, OnboardingStep, ShopDto, ShopProfileData } from '@sijaf/shared';
import { and, eq, sql } from 'drizzle-orm';
import { toShopDto, toUserDto } from '../common/dto.js';
import { DB, type Db } from '../db/db.module.js';
import { shops, users } from '../db/schema.js';
import { detectImageType, imageExtensions } from '../storage/image-type.js';
import { STORAGE, type FileStorage, type StoredFile } from '../storage/storage.js';

@Injectable()
export class ShopsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(STORAGE) private readonly storage: FileStorage,
  ) {}

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

  /** اللوجو بيظهر في العرض وفي الـ PDF؛ كل لوجو جديد ليه اسم جديد عشان الكاش */
  async setLogo(shopId: string, bytes: Buffer): Promise<ShopDto> {
    const contentType = detectImageType(bytes);
    if (!contentType) throw new BadRequestException('اللوجو لازم يبقى صورة JPG أو PNG');
    const key = `${shopId}/logo-${randomUUID()}.${imageExtensions[contentType]}`;
    await this.storage.put(key, { bytes, contentType });
    return this.updateShop(shopId, { logoPath: key });
  }

  removeLogo(shopId: string): Promise<ShopDto> {
    return this.updateShop(shopId, { logoPath: null });
  }

  async logo(shopId: string): Promise<StoredFile> {
    const [shop] = await this.db.select({ logoPath: shops.logoPath }).from(shops).where(eq(shops.id, shopId));
    const file = shop?.logoPath ? await this.storage.get(shop.logoPath) : null;
    if (!file) throw new NotFoundException('مفيش لوجو');
    return file;
  }

  private async updateShop(shopId: string, values: Partial<typeof shops.$inferInsert>): Promise<ShopDto> {
    const [shop] = await this.db.update(shops).set(values).where(eq(shops.id, shopId)).returning();
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
