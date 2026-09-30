import { sql } from 'drizzle-orm';
import {
  curtainStyles,
  itemBases,
  materialLayers,
  materialUnits,
  modelItemKinds,
  operations,
  paymentMethods,
  pricingMethods,
  stockStatuses,
  tiers,
} from '@sijaf/shared';
import { boolean, index, integer, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

/*
 * كل الجداول عليها RLS من غير policies: Supabase بيفتح الـ public schema للـ REST API،
 * فكده محدش يقدر يقرا حاجة بمفتاح anon. الـ API بيتصل كـ owner للجداول وبيعمل
 * عزل المحلات بنفسه (كل query متقيدة بـ shopId من التوكن).
 */

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const userRole = pgEnum('user_role', ['owner', 'technician']);

export const shops = pgTable('shops', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  whatsapp: text('whatsapp'),
  address: text('address').notNull().default(''),
  logoPath: text('logo_path'),
  completedSteps: text('completed_steps')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  onboardingDismissed: boolean('onboarding_dismissed').notNull().default(false),
  nextQuoteNumber: integer('next_quote_number').notNull().default(1001),
  ...timestamps,
}).enableRLS();

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    /** بالشكل المحلي 01xxxxxxxxx، ومش ممكن يتكرر في النظام كله */
    phone: text('phone').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: userRole('role').notNull(),
    jobTitle: text('job_title').notNull().default(''),
    canQuote: boolean('can_quote').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index('users_shop_id_idx').on(table.shopId)],
).enableRLS();

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** sha256 للتوكن، التوكن نفسه مابيتخزنش */
    tokenHash: text('token_hash').notNull().unique(),
    /** كل تسجيل دخول family؛ لو توكن قديم اتستخدم تاني بنلغي الـ family كلها */
    familyId: uuid('family_id').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('refresh_tokens_family_idx').on(table.familyId), index('refresh_tokens_user_idx').on(table.userId)],
).enableRLS();

export type ShopRow = typeof shops.$inferSelect;
export type UserRow = typeof users.$inferSelect;

// ---------- الكتالوج ----------

export const paymentMethod = pgEnum('payment_method', paymentMethods);
export const materialLayer = pgEnum('material_layer', materialLayers);
export const tier = pgEnum('tier', tiers);
export const materialUnit = pgEnum('material_unit', materialUnits);
export const stockStatus = pgEnum('stock_status', stockStatuses);
export const pricingMethod = pgEnum('pricing_method', pricingMethods);
export const operation = pgEnum('operation', operations);
export const modelItemKind = pgEnum('model_item_kind', modelItemKinds);
export const itemBasis = pgEnum('item_basis', itemBases);
export const curtainStyle = pgEnum('curtain_style', curtainStyles);

/** فلوس بقرشين؛ drizzle بيرجّعها number */
const money = (name: string) => numeric(name, { precision: 12, scale: 2, mode: 'number' });

const shopId = () =>
  uuid('shop_id')
    .notNull()
    .references(() => shops.id, { onDelete: 'cascade' });

export const suppliers = pgTable(
  'suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: shopId(),
    name: text('name').notNull(),
    specialty: text('specialty').notNull().default(''),
    contactName: text('contact_name').notNull().default(''),
    whatsapp: text('whatsapp'),
    address: text('address').notNull().default(''),
    paymentMethod: paymentMethod('payment_method').notNull().default('cash'),
    creditDays: integer('credit_days'),
    leadTimeMinDays: integer('lead_time_min_days'),
    leadTimeMaxDays: integer('lead_time_max_days'),
    pricesUpdatedAt: timestamp('prices_updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [uniqueIndex('suppliers_shop_name_idx').on(table.shopId, table.name)],
).enableRLS();

export const materials = pgTable(
  'materials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: shopId(),
    name: text('name').notNull(),
    layer: materialLayer('layer').notNull(),
    look: text('look'),
    tier: tier('tier').notNull().default('standard'),
    unit: materialUnit('unit').notNull().default('meter'),
    supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
    supplierCode: text('supplier_code').notNull().default(''),
    /** لصاحب المحل بس: مابيطلعش في أي رد للفني */
    purchasePrice: money('purchase_price'),
    sellPrice: money('sell_price').notNull(),
    topWidthM: numeric('top_width_m', { precision: 4, scale: 2, mode: 'number' }),
    stockStatus: stockStatus('stock_status').notNull().default('available'),
    ...timestamps,
  },
  (table) => [
    index('materials_shop_layer_idx').on(table.shopId, table.layer),
    index('materials_supplier_idx').on(table.supplierId),
  ],
).enableRLS();

export const curtainModels = pgTable(
  'curtain_models',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: shopId(),
    name: text('name').notNull(),
    pricingMethod: pricingMethod('pricing_method').notNull(),
    fullness: numeric('fullness', { precision: 4, scale: 2, mode: 'number' }).notNull().default(1),
    /** مصنعية المتر (أو المتر المربع أو القطعة حسب طريقة الحساب) */
    laborPerUnit: money('labor_per_unit').notNull().default(0),
    operation: operation('operation').notNull().default('manual'),
    style: curtainStyle('style').notNull().default('other'),
    technicianNote: text('technician_note').notNull().default(''),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
  },
  (table) => [index('curtain_models_shop_idx').on(table.shopId)],
).enableRLS();

export const modelItems = pgTable(
  'model_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: shopId(),
    modelId: uuid('model_id')
      .notNull()
      .references(() => curtainModels.id, { onDelete: 'cascade' }),
    kind: modelItemKind('kind').notNull(),
    materialId: uuid('material_id').references(() => materials.id, { onDelete: 'set null' }),
    /** اسم البند؛ لو مربوط بخامة بيبقى نسخة من اسمها عشان يفضل لو الخامة اتمسحت */
    label: text('label').notNull(),
    /** سعر ثابت للبنود اللي مش من الكتالوج */
    unitPrice: money('unit_price'),
    basis: itemBasis('basis').notNull().default('per_window'),
    quantity: numeric('quantity', { precision: 8, scale: 2, mode: 'number' }).notNull().default(1),
    isRequired: boolean('is_required').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('model_items_model_idx').on(table.modelId)],
).enableRLS();

export type SupplierRow = typeof suppliers.$inferSelect;
export type MaterialRow = typeof materials.$inferSelect;
export type CurtainModelRow = typeof curtainModels.$inferSelect;
export type ModelItemRow = typeof modelItems.$inferSelect;
