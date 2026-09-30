import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  /** Supabase transaction pooler (port 6543) للتطبيق */
  DATABASE_URL: z.string().url(),
  /** Supabase session pooler للـ migrations */
  DIRECT_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET لازم يبقى 32 حرف على الأقل'),
  /** مفتاح مشترك مع Next عشان الـ API يثق في IP العميل اللي Next بيبعته (مطلوب في الإنتاج) */
  INTERNAL_API_SECRET: z.string().min(32, 'INTERNAL_API_SECRET لازم يبقى 32 حرف على الأقل').optional(),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(15 * 60),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(30 * 24 * 60 * 60),
}).refine((env) => env.NODE_ENV !== 'production' || env.INTERNAL_API_SECRET, {
  // من غيره كل المستخدمين هيشاركوا نفس حد الطلبات (IP سيرفر Next)
  message: 'INTERNAL_API_SECRET مطلوب في الإنتاج',
  path: ['INTERNAL_API_SECRET'],
});

export type Env = z.infer<typeof envSchema>;

export const ENV = Symbol('ENV');

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
    throw new Error(`إعدادات البيئة ناقصة أو غلط:\n${details}`);
  }
  return result.data;
}
