// بيطبّق migrations الـ drizzle على قاعدة البيانات (DIRECT_URL أو DATABASE_URL)
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

try {
  process.loadEnvFile('.env');
} catch {
  // في الـ CI المتغيرات جاية من البيئة
}

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error('DIRECT_URL أو DATABASE_URL لازم يبقى موجود');
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
try {
  await migrate(drizzle(sql), { migrationsFolder: './drizzle' });
  console.log('✓ migrations applied');
} catch (error) {
  console.error('✗ migration failed:', error instanceof Error ? error.message : error);
  if (error instanceof Error && error.cause) console.error('  cause:', error.cause instanceof Error ? error.cause.message : error.cause);
  process.exitCode = 1;
} finally {
  await sql.end();
}
