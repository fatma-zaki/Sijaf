import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { ENV, loadEnv } from '../src/config/env.js';
import { DB } from '../src/db/db.module.js';
import * as schema from '../src/db/schema.js';

const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));

export type TestApp = {
  app: INestApplication<App>;
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

  const app = moduleRef.createNestApplication<INestApplication<App>>();
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
