import { sql } from 'drizzle-orm';
import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
