import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  materialLayers,
  type ImportRow,
  type MaterialData,
  type MaterialDto,
  type MaterialImportResult,
  type MaterialLayer,
  type MaterialListDto,
  type MaterialPublicDto,
  type UserRole,
  type materialListQuerySchema,
} from '@sijaf/shared';
import { and, asc, count, desc, eq, ilike, inArray, isNull, or, type SQL } from 'drizzle-orm';
import type { z } from 'zod';
import { ShopsService } from '../shops/shops.service.js';
import { DB, type Db } from '../db/db.module.js';
import { materials, modelItems, suppliers, type MaterialRow } from '../db/schema.js';
import { nameKey } from './normalize.js';
import { SuppliersService } from './suppliers.service.js';

type ListQuery = z.output<typeof materialListQuerySchema>;
type MaterialWithSupplier = { material: MaterialRow; supplierName: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function toPublicMaterial(row: MaterialRow): MaterialPublicDto {
  return {
    id: row.id,
    name: row.name,
    layer: row.layer,
    look: row.look,
    tier: row.tier,
    unit: row.unit,
    sellPrice: row.sellPrice,
    topWidthM: row.topWidthM,
    stockStatus: row.stockStatus,
  };
}

export function toOwnerMaterial({ material, supplierName }: MaterialWithSupplier): MaterialDto {
  return {
    ...toPublicMaterial(material),
    supplierId: material.supplierId,
    supplierName,
    supplierCode: material.supplierCode,
    purchasePrice: material.purchasePrice,
  };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

@Injectable()
export class MaterialsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(SuppliersService) private readonly suppliers: SuppliersService,
    @Inject(ShopsService) private readonly shops: ShopsService,
  ) {}

  private withSupplier() {
    return this.db
      .select({ material: materials, supplierName: suppliers.name })
      .from(materials)
      .leftJoin(suppliers, eq(suppliers.id, materials.supplierId));
  }

  async list(shopId: string, query: ListQuery): Promise<MaterialListDto> {
    // الفلاتر المشتركة (البحث والمستوى) بتأثر على العدادات، لكن الطبقة والمورد لأ
    const base: SQL[] = [eq(materials.shopId, shopId)];
    if (query.q) {
      const pattern = `%${escapeLike(query.q)}%`;
      const search = or(ilike(materials.name, pattern), ilike(suppliers.name, pattern), ilike(materials.supplierCode, pattern));
      if (search) base.push(search);
    }
    if (query.tier) base.push(eq(materials.tier, query.tier));

    const filters = [...base];
    if (query.layer) filters.push(eq(materials.layer, query.layer));
    const supplierFilter = this.supplierFilter(query.suppliers);
    if (supplierFilter) filters.push(supplierFilter);

    const where = and(...filters);
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(materials)
      .leftJoin(suppliers, eq(suppliers.id, materials.supplierId))
      .where(where);
    const rows = await this.withSupplier()
      .where(where)
      .orderBy(asc(materials.layer), asc(materials.look), asc(materials.tier), asc(materials.name))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);

    const layerCounts = await this.db
      .select({ layer: materials.layer, count: count() })
      .from(materials)
      .leftJoin(suppliers, eq(suppliers.id, materials.supplierId))
      .where(and(...base))
      .groupBy(materials.layer);
    const supplierCounts = await this.db
      .select({ id: suppliers.id, name: suppliers.name, count: count(materials.id) })
      .from(suppliers)
      .leftJoin(materials, and(eq(materials.supplierId, suppliers.id), ...base.slice(1)))
      .where(eq(suppliers.shopId, shopId))
      .groupBy(suppliers.id)
      .orderBy(desc(count(materials.id)), asc(suppliers.name));

    const layers = Object.fromEntries(materialLayers.map((layer) => [layer, 0])) as Record<MaterialLayer, number>;
    for (const row of layerCounts) layers[row.layer] = row.count;

    return {
      items: rows.map(toOwnerMaterial),
      total,
      page: query.page,
      pageSize: query.pageSize,
      facets: {
        all: layerCounts.reduce((sum, row) => sum + row.count, 0),
        layers,
        suppliers: supplierCounts,
      },
    };
  }

  /** كل الخامات للقوايم (بنود الموديلات والعروض)؛ الفني بياخدها من غير أسعار الشراء */
  async options(shopId: string, role: UserRole): Promise<MaterialDto[] | MaterialPublicDto[]> {
    const rows = await this.withSupplier().where(eq(materials.shopId, shopId)).orderBy(asc(materials.layer), asc(materials.name));
    return role === 'owner' ? rows.map(toOwnerMaterial) : rows.map((row) => toPublicMaterial(row.material));
  }

  async get(shopId: string, id: string): Promise<MaterialDto> {
    const [row] = await this.withSupplier().where(and(eq(materials.id, id), eq(materials.shopId, shopId)));
    if (!row) throw new NotFoundException('الخامة مش موجودة');
    return toOwnerMaterial(row);
  }

  async create(shopId: string, data: MaterialData): Promise<MaterialDto> {
    await this.assertSupplierInShop(shopId, data.supplierId);
    const [row] = await this.db.insert(materials).values({ ...data, shopId }).returning({ id: materials.id });
    await this.shops.completeStep(shopId, 'prices');
    return this.get(shopId, row.id);
  }

  async update(shopId: string, id: string, data: MaterialData): Promise<MaterialDto> {
    await this.assertSupplierInShop(shopId, data.supplierId);
    const before = await this.get(shopId, id);
    await this.db.update(materials).set(data).where(and(eq(materials.id, id), eq(materials.shopId, shopId)));
    const priceChanged = before.sellPrice !== data.sellPrice || before.purchasePrice !== data.purchasePrice;
    if (priceChanged && data.supplierId) await this.suppliers.touchPrices(this.db, shopId, [data.supplierId]);
    // اسم البند في الموديلات بيتبع اسم الخامة
    await this.db.update(modelItems).set({ label: data.name }).where(eq(modelItems.materialId, id));
    return this.get(shopId, id);
  }

  /** البنود المربوطة بالخامة في الموديلات بتفضل باسمها وسعرها الأخير */
  async remove(shopId: string, id: string): Promise<void> {
    const material = await this.get(shopId, id);
    await this.db.transaction(async (tx) => {
      await tx
        .update(modelItems)
        .set({ materialId: null, label: material.name, unitPrice: material.sellPrice })
        .where(eq(modelItems.materialId, id));
      await tx.delete(materials).where(and(eq(materials.id, id), eq(materials.shopId, shopId)));
    });
  }

  /**
   * استيراد من Excel: الخامة الموجودة (بكود المورد، أو بالاسم) بتتحدث، والجديدة بتتضاف.
   * الموردين اللي مش موجودين بيتعملوا بالاسم.
   */
  async import(shopId: string, rows: ImportRow[]): Promise<MaterialImportResult> {
    const result = await this.db.transaction(async (tx) => {
      const existingSuppliers = await tx.select({ id: suppliers.id, name: suppliers.name }).from(suppliers).where(eq(suppliers.shopId, shopId));
      const supplierIds = new Map(existingSuppliers.map((s) => [nameKey(s.name), s.id]));
      let suppliersCreated = 0;
      for (const row of rows) {
        if (!row.supplierName || supplierIds.has(nameKey(row.supplierName))) continue;
        const [created] = await tx.insert(suppliers).values({ shopId, name: row.supplierName }).returning({ id: suppliers.id });
        supplierIds.set(nameKey(row.supplierName), created.id);
        suppliersCreated += 1;
      }

      const existing = await tx
        .select({ id: materials.id, name: materials.name, supplierId: materials.supplierId, supplierCode: materials.supplierCode })
        .from(materials)
        .where(eq(materials.shopId, shopId));
      const byCode = new Map(existing.filter((m) => m.supplierCode).map((m) => [`${m.supplierId}|${nameKey(m.supplierCode)}`, m.id]));
      const byName = new Map(existing.map((m) => [nameKey(m.name), m.id]));

      let created = 0;
      let updated = 0;
      const touched = new Set<string>();
      for (const row of rows) {
        const supplierId = row.supplierName ? (supplierIds.get(nameKey(row.supplierName)) ?? null) : null;
        const values = {
          name: row.name,
          layer: row.layer,
          look: row.look,
          tier: row.tier,
          unit: row.unit,
          supplierId,
          supplierCode: row.supplierCode,
          purchasePrice: row.purchasePrice,
          sellPrice: row.sellPrice,
          topWidthM: row.topWidthM,
        };
        const codeMatch = row.supplierCode ? byCode.get(`${supplierId}|${nameKey(row.supplierCode)}`) : undefined;
        const nameMatch = byName.get(nameKey(row.name));
        const matchId = codeMatch ?? nameMatch;
        if (matchId) {
          // مطابقة بالاسم = نفس الخامة بإملاء مختلف، فبنسيب اسمها زي ما هو في الكتالوج
          const { name, ...rest } = values;
          await tx
            .update(materials)
            .set(codeMatch ? values : rest)
            .where(eq(materials.id, matchId));
          if (codeMatch) byName.set(nameKey(name), matchId);
          updated += 1;
        } else {
          const [inserted] = await tx.insert(materials).values({ ...values, shopId }).returning({ id: materials.id });
          byName.set(nameKey(row.name), inserted.id);
          created += 1;
        }
        if (supplierId) touched.add(supplierId);
      }
      await this.suppliers.touchPrices(tx, shopId, [...touched]);
      return { created, updated, suppliersCreated };
    });
    await this.shops.completeStep(shopId, 'prices');
    return result;
  }

  private supplierFilter(value: string | undefined): SQL | undefined {
    if (!value) return undefined;
    const parts = value.split(',').map((part) => part.trim());
    const ids = parts.filter((part) => UUID.test(part));
    const conditions: SQL[] = [];
    if (ids.length > 0) conditions.push(inArray(materials.supplierId, ids));
    if (parts.includes('none')) conditions.push(isNull(materials.supplierId));
    // فلتر بقيم كلها غلط = مفيش نتايج، مش كل الخامات
    return conditions.length > 0 ? or(...conditions) : eq(materials.id, '00000000-0000-0000-0000-000000000000');
  }

  private async assertSupplierInShop(shopId: string, supplierId: string | null): Promise<void> {
    if (!supplierId) return;
    const [row] = await this.db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(and(eq(suppliers.id, supplierId), eq(suppliers.shopId, shopId)));
    if (!row) {
      throw new BadRequestException({ statusCode: 400, message: 'المورد مش موجود', fieldErrors: { supplierId: 'اختار مورد من القايمة' } });
    }
  }
}
