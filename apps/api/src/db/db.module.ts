import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { ENV, type Env } from '../config/env.js';
import * as schema from './schema.js';

/** نفس النوع لـ postgres-js في التشغيل وPGlite في التيستات */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export const DB = Symbol('DB');
const SQL_CLIENT = Symbol('SQL_CLIENT');

/** بيقفل الاتصال لما التطبيق يقفل */
class SqlClientCloser implements OnApplicationShutdown {
  constructor(@Inject(SQL_CLIENT) private readonly sql: postgres.Sql) {}

  async onApplicationShutdown(): Promise<void> {
    await this.sql.end({ timeout: 5 });
  }
}

@Global()
@Module({
  providers: [
    {
      provide: SQL_CLIENT,
      inject: [ENV],
      // الـ transaction pooler بتاع Supabase مابيدعمش prepared statements
      useFactory: (env: Env) => postgres(env.DATABASE_URL, { prepare: false, max: 5 }),
    },
    {
      provide: DB,
      inject: [SQL_CLIENT],
      useFactory: (sql: postgres.Sql): Db => drizzle(sql, { schema }),
    },
    SqlClientCloser,
  ],
  exports: [DB],
})
export class DbModule {}
