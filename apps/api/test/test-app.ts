import type { AuthTokens } from '@sijaf/shared';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { ENV, loadEnv } from '../src/config/env.js';
import { configureApp } from '../src/configure-app.js';
import { DB } from '../src/db/db.module.js';
import * as schema from '../src/db/schema.js';

const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));

export type TestApp = {
  app: NestExpressApplication;
  http: () => ReturnType<typeof request>;
  close: () => Promise<void>;
};

/** التطبيق كامل على Postgres في الذاكرة (PGlite) بنفس الـ migrations */
export async function createTestApp(): Promise<TestApp> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ENV)
    .useValue(
      loadEnv({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgres://unused:unused@localhost:5432/unused',
        JWT_SECRET: 'test-secret-that-is-long-enough-for-hs256-signing',
      }),
    )
    .overrideProvider(DB)
    .useValue(db)
    .compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app);
  await app.init();

  return {
    app,
    http: () => request(app.getHttpServer()),
    close: async () => {
      await app.close();
      await client.close();
    },
  };
}

let phoneCounter = 0;

/** رقم موبايل مصري مختلف في كل مرة */
export function nextPhone(): string {
  phoneCounter += 1;
  return `0100${String(1_000_000 + phoneCounter).slice(-7)}`;
}

export const TEST_PASSWORD = 'secret-pass-1';

export const bearer = (tokens: AuthTokens) => ({ Authorization: `Bearer ${tokens.accessToken}` });

/** محل جديد بصاحبه، وبيرجّع توكنات صاحب المحل */
export async function registerShop(t: TestApp, shopName = 'ستائر الأمل'): Promise<AuthTokens> {
  const res = await t
    .http()
    .post('/auth/register')
    .send({ shopName, ownerName: 'محمد', phone: nextPhone(), password: TEST_PASSWORD })
    .expect(201);
  return res.body as AuthTokens;
}

/** فني في نفس المحل، وبيرجّع توكناته */
export async function addTechnician(t: TestApp, owner: AuthTokens, canQuote = true): Promise<AuthTokens> {
  const phone = nextPhone();
  await t
    .http()
    .post('/users')
    .set(bearer(owner))
    .send({ fullName: 'عمرو', phone, password: TEST_PASSWORD, canQuote })
    .expect(201);
  const res = await t.http().post('/auth/login').send({ phone, password: TEST_PASSWORD }).expect(200);
  return res.body as AuthTokens;
}
