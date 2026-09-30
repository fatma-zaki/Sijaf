import { and, eq, isNull } from 'drizzle-orm';
import type { Executor } from '../db/executor.js';
import { curtainModels, materials, modelItems } from '../db/schema.js';
import { nameKey } from './normalize.js';
import { templateModels } from './templates.js';

/** بيضيف الـ 8 موديلات الجاهزة لمحل (بيتنادى عند التسجيل ومن «ضيف الموديلات الجاهزة») */
export async function insertTemplateModels(db: Executor, shopId: string): Promise<number> {
  for (const [index, template] of templateModels.entries()) {
    const { items, ...model } = template;
    const [row] = await db
      .insert(curtainModels)
      .values({ ...model, shopId, sortOrder: index })
      .returning({ id: curtainModels.id });
    if (items.length > 0) {
      await db.insert(modelItems).values(
        items.map((item, itemIndex) => ({ ...item, shopId, modelId: row.id, materialId: null, sortOrder: itemIndex })),
      );
    }
  }
  await linkModelItemsToCatalog(db, shopId);
  return templateModels.length;
}

/**
 * بيربط بنود الموديلات اللي بسعر ثابت بخامات الكتالوج اللي بنفس الاسم،
 * فالسعر بعد كده بييجي من الكتالوج (وبيتغير لما السعر يتغير).
 */
export async function linkModelItemsToCatalog(db: Executor, shopId: string): Promise<number> {
  const catalog = await db
    .select({ id: materials.id, name: materials.name })
    .from(materials)
    .where(eq(materials.shopId, shopId));
  const byName = new Map(catalog.map((material) => [nameKey(material.name), material]));

  const unlinked = await db
    .select({ id: modelItems.id, label: modelItems.label })
    .from(modelItems)
    .where(and(eq(modelItems.shopId, shopId), isNull(modelItems.materialId)));

  let linked = 0;
  for (const item of unlinked) {
    const material = byName.get(nameKey(item.label));
    if (!material) continue;
    await db
      .update(modelItems)
      .set({ materialId: material.id, label: material.name, unitPrice: null })
      .where(eq(modelItems.id, item.id));
    linked += 1;
  }
  return linked;
}
