import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { SupplierData, SupplierDto } from '@sijaf/shared';
import { and, asc, count, eq, inArray, ne } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module.js';
import type { Executor } from '../db/executor.js';
import { materials, suppliers, type SupplierRow } from '../db/schema.js';
import { nameKey } from './normalize.js';

const NAME_TAKEN = 'فيه مورد بنفس الاسم';

export function toSupplierDto(row: SupplierRow, materialsCount: number): SupplierDto {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    contactName: row.contactName,
    whatsapp: row.whatsapp,
    address: row.address,
    paymentMethod: row.paymentMethod,
    creditDays: row.creditDays,
    leadTimeMinDays: row.leadTimeMinDays,
    leadTimeMaxDays: row.leadTimeMaxDays,
    materialsCount,
    pricesUpdatedAt: row.pricesUpdatedAt.toISOString(),
  };
}

@Injectable()
export class SuppliersService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(shopId: string): Promise<SupplierDto[]> {
    const rows = await this.db
      .select({ supplier: suppliers, materialsCount: count(materials.id) })
      .from(suppliers)
      .leftJoin(materials, eq(materials.supplierId, suppliers.id))
      .where(eq(suppliers.shopId, shopId))
      .groupBy(suppliers.id)
      .orderBy(asc(suppliers.createdAt));
    return rows.map((row) => toSupplierDto(row.supplier, row.materialsCount));
  }

  async get(shopId: string, id: string): Promise<SupplierDto> {
    const [row] = await this.db
      .select({ supplier: suppliers, materialsCount: count(materials.id) })
      .from(suppliers)
      .leftJoin(materials, eq(materials.supplierId, suppliers.id))
      .where(and(eq(suppliers.id, id), eq(suppliers.shopId, shopId)))
      .groupBy(suppliers.id);
    if (!row) throw new NotFoundException('المورد مش موجود');
    return toSupplierDto(row.supplier, row.materialsCount);
  }

  async create(shopId: string, data: SupplierData): Promise<SupplierDto> {
    await this.assertNameAvailable(shopId, data.name);
    const [row] = await this.db.insert(suppliers).values({ ...data, shopId }).returning();
    return toSupplierDto(row, 0);
  }

  async update(shopId: string, id: string, data: SupplierData): Promise<SupplierDto> {
    await this.assertNameAvailable(shopId, data.name, id);
    const [row] = await this.db
      .update(suppliers)
      .set(data)
      .where(and(eq(suppliers.id, id), eq(suppliers.shopId, shopId)))
      .returning({ id: suppliers.id });
    if (!row) throw new NotFoundException('المورد مش موجود');
    return this.get(shopId, id);
  }

  /** الخامات بتفضل في الكتالوج من غير مورد */
  async remove(shopId: string, id: string): Promise<void> {
    const deleted = await this.db
      .delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.shopId, shopId)))
      .returning({ id: suppliers.id });
    if (deleted.length === 0) throw new NotFoundException('المورد مش موجود');
  }

  /** لما أسعار خامات المورد تتغير */
  async touchPrices(db: Executor, shopId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await db
      .update(suppliers)
      .set({ pricesUpdatedAt: new Date() })
      .where(and(eq(suppliers.shopId, shopId), inArray(suppliers.id, ids)));
  }

  private async assertNameAvailable(shopId: string, name: string, exceptId?: string): Promise<void> {
    const rows = await this.db
      .select({ id: suppliers.id, name: suppliers.name })
      .from(suppliers)
      .where(exceptId ? and(eq(suppliers.shopId, shopId), ne(suppliers.id, exceptId)) : eq(suppliers.shopId, shopId));
    if (rows.some((row) => nameKey(row.name) === nameKey(name))) {
      throw new ConflictException({ statusCode: 409, message: NAME_TAKEN, fieldErrors: { name: NAME_TAKEN } });
    }
  }
}
