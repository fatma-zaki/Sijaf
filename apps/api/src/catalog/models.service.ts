import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CurtainModelData, CurtainModelDto, ModelItemDto } from '@sijaf/shared';
import { and, asc, count, eq, inArray } from 'drizzle-orm';
import { ShopsService } from '../shops/shops.service.js';
import { DB, type Db } from '../db/db.module.js';
import type { Executor } from '../db/executor.js';
import { curtainModels, materials, modelItems, suppliers, type CurtainModelRow } from '../db/schema.js';
import { insertTemplateModels } from './model-seed.js';

/** أعمدة الموديل من غير البنود */
function modelColumns(data: CurtainModelData) {
  return {
    name: data.name,
    pricingMethod: data.pricingMethod,
    fullness: data.pricingMethod === 'linear_fullness' ? data.fullness : 1,
    laborPerUnit: data.laborPerUnit,
    operation: data.operation,
    technicianNote: data.technicianNote,
  };
}

@Injectable()
export class ModelsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(ShopsService) private readonly shops: ShopsService,
  ) {}

  async list(shopId: string): Promise<CurtainModelDto[]> {
    const models = await this.db
      .select()
      .from(curtainModels)
      .where(eq(curtainModels.shopId, shopId))
      .orderBy(asc(curtainModels.sortOrder), asc(curtainModels.createdAt));
    return this.withItems(shopId, models);
  }

  async get(shopId: string, id: string): Promise<CurtainModelDto> {
    const [model] = await this.db
      .select()
      .from(curtainModels)
      .where(and(eq(curtainModels.id, id), eq(curtainModels.shopId, shopId)));
    if (!model) throw new NotFoundException('الموديل مش موجود');
    const [dto] = await this.withItems(shopId, [model]);
    return dto;
  }

  async create(shopId: string, data: CurtainModelData): Promise<CurtainModelDto> {
    const id = await this.db.transaction(async (tx) => {
      const [{ total }] = await tx.select({ total: count() }).from(curtainModels).where(eq(curtainModels.shopId, shopId));
      const [row] = await tx
        .insert(curtainModels)
        .values({ ...modelColumns(data), shopId, sortOrder: total })
        .returning({ id: curtainModels.id });
      await this.replaceItems(tx, shopId, row.id, data);
      return row.id;
    });
    return this.get(shopId, id);
  }

  async update(shopId: string, id: string, data: CurtainModelData): Promise<CurtainModelDto> {
    await this.db.transaction(async (tx) => {
      const updated = await tx
        .update(curtainModels)
        .set(modelColumns(data))
        .where(and(eq(curtainModels.id, id), eq(curtainModels.shopId, shopId)))
        .returning({ id: curtainModels.id });
      if (updated.length === 0) throw new NotFoundException('الموديل مش موجود');
      await this.replaceItems(tx, shopId, id, data);
    });
    await this.shops.completeStep(shopId, 'models');
    return this.get(shopId, id);
  }

  async remove(shopId: string, id: string): Promise<void> {
    const deleted = await this.db
      .delete(curtainModels)
      .where(and(eq(curtainModels.id, id), eq(curtainModels.shopId, shopId)))
      .returning({ id: curtainModels.id });
    if (deleted.length === 0) throw new NotFoundException('الموديل مش موجود');
  }

  /** الموديلات الجاهزة لمحل ماعندوش موديلات (المحلات اللي اتسجلت قبل الكتالوج) */
  async addDefaults(shopId: string): Promise<CurtainModelDto[]> {
    const [{ total }] = await this.db.select({ total: count() }).from(curtainModels).where(eq(curtainModels.shopId, shopId));
    if (total === 0) await this.db.transaction((tx) => insertTemplateModels(tx, shopId));
    return this.list(shopId);
  }

  /** البنود بتتبدل كلها مع كل حفظ؛ الخامات لازم تبقى من كتالوج نفس المحل */
  private async replaceItems(tx: Executor, shopId: string, modelId: string, data: CurtainModelData): Promise<void> {
    const materialIds = [...new Set(data.items.flatMap((item) => (item.materialId ? [item.materialId] : [])))];
    const found = materialIds.length
      ? await tx
          .select({ id: materials.id, name: materials.name })
          .from(materials)
          .where(and(eq(materials.shopId, shopId), inArray(materials.id, materialIds)))
      : [];
    const names = new Map(found.map((material) => [material.id, material.name]));
    const missing = data.items.findIndex((item) => item.materialId && !names.has(item.materialId));
    if (missing >= 0) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'فيه بند مربوط بخامة مش موجودة في الكتالوج',
        fieldErrors: { [`items.${missing}.materialId`]: 'اختار خامة من الكتالوج' },
      });
    }

    await tx.delete(modelItems).where(and(eq(modelItems.modelId, modelId), eq(modelItems.shopId, shopId)));
    if (data.items.length === 0) return;
    await tx.insert(modelItems).values(
      data.items.map((item, index) => ({
        shopId,
        modelId,
        kind: item.kind,
        materialId: item.materialId,
        label: item.materialId ? (names.get(item.materialId) ?? item.label) : item.label,
        unitPrice: item.materialId ? null : item.unitPrice,
        basis: item.basis,
        quantity: item.quantity,
        isRequired: item.isRequired,
        sortOrder: index,
      })),
    );
  }

  private async withItems(shopId: string, models: CurtainModelRow[]): Promise<CurtainModelDto[]> {
    if (models.length === 0) return [];
    const rows = await this.db
      .select({ item: modelItems, sellPrice: materials.sellPrice, supplierName: suppliers.name })
      .from(modelItems)
      .leftJoin(materials, eq(materials.id, modelItems.materialId))
      .leftJoin(suppliers, eq(suppliers.id, materials.supplierId))
      .where(and(eq(modelItems.shopId, shopId), inArray(modelItems.modelId, models.map((model) => model.id))))
      .orderBy(asc(modelItems.sortOrder));

    const itemsByModel = new Map<string, ModelItemDto[]>();
    for (const { item, sellPrice, supplierName } of rows) {
      const list = itemsByModel.get(item.modelId) ?? [];
      list.push({
        id: item.id,
        kind: item.kind,
        materialId: item.materialId,
        label: item.label,
        price: sellPrice ?? item.unitPrice ?? 0,
        unitPrice: item.unitPrice,
        supplierName,
        basis: item.basis,
        quantity: item.quantity,
        isRequired: item.isRequired,
      });
      itemsByModel.set(item.modelId, list);
    }

    return models.map((model) => ({
      id: model.id,
      name: model.name,
      pricingMethod: model.pricingMethod,
      fullness: model.fullness,
      laborPerUnit: model.laborPerUnit,
      operation: model.operation,
      style: model.style,
      technicianNote: model.technicianNote,
      items: itemsByModel.get(model.id) ?? [],
    }));
  }
}
