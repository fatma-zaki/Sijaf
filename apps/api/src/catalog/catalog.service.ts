import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { CatalogCountsDto, TemplateApplyResult } from '@sijaf/shared';
import { count, eq } from 'drizzle-orm';
import { ShopsService } from '../shops/shops.service.js';
import { DB, type Db } from '../db/db.module.js';
import { curtainModels, materials, suppliers } from '../db/schema.js';
import { linkModelItemsToCatalog } from './model-seed.js';
import { nameKey } from './normalize.js';
import { templateMaterials, templateSuppliers } from './templates.js';

@Injectable()
export class CatalogService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(ShopsService) private readonly shops: ShopsService,
  ) {}

  async counts(shopId: string): Promise<CatalogCountsDto> {
    const [[m], [s], [c]] = await Promise.all([
      this.db.select({ total: count() }).from(materials).where(eq(materials.shopId, shopId)),
      this.db.select({ total: count() }).from(suppliers).where(eq(suppliers.shopId, shopId)),
      this.db.select({ total: count() }).from(curtainModels).where(eq(curtainModels.shopId, shopId)),
    ]);
    return { materials: m.total, suppliers: s.total, models: c.total };
  }

  /**
   * «ابدأ بأسعار نموذجية»: بيضيف الموردين والخامات النموذجية لمحل كتالوجه فاضي،
   * وبيربط بنود الموديلات (الموتور والإكسسوارات) بالخامات اللي بنفس الاسم.
   */
  async applyTemplate(shopId: string): Promise<TemplateApplyResult> {
    const result = await this.db.transaction(async (tx) => {
      const [{ total }] = await tx.select({ total: count() }).from(materials).where(eq(materials.shopId, shopId));
      if (total > 0) {
        throw new ConflictException('الكتالوج فيه خامات بالفعل؛ القايمة النموذجية للمحلات الجديدة بس');
      }

      const existing = await tx.select({ id: suppliers.id, name: suppliers.name }).from(suppliers).where(eq(suppliers.shopId, shopId));
      const supplierIds = new Map<string, string>();
      let createdSuppliers = 0;
      for (const { key, ...supplier } of templateSuppliers) {
        const match = existing.find((row) => nameKey(row.name) === nameKey(supplier.name));
        if (match) {
          supplierIds.set(key, match.id);
          continue;
        }
        const [row] = await tx.insert(suppliers).values({ ...supplier, shopId }).returning({ id: suppliers.id });
        supplierIds.set(key, row.id);
        createdSuppliers += 1;
      }

      await tx.insert(materials).values(
        templateMaterials.map(({ supplier, ...material }) => ({
          ...material,
          shopId,
          supplierId: supplierIds.get(supplier) ?? null,
        })),
      );
      const linkedItems = await linkModelItemsToCatalog(tx, shopId);
      return { materials: templateMaterials.length, suppliers: createdSuppliers, linkedItems };
    });
    await this.shops.completeStep(shopId, 'prices');
    return result;
  }
}
