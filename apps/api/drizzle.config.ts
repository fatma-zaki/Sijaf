import { defineConfig } from 'drizzle-kit';

try {
  process.loadEnvFile('.env');
} catch {
  // في الـ CI المتغيرات جاية من البيئة
}

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error('DIRECT_URL أو DATABASE_URL لازم يبقى موجود');

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url },
  strict: true,
});
