import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AiModule } from './ai/ai.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { AuthGuard } from './common/auth.guard.js';
import { ClientIpThrottlerGuard } from './common/client-ip-throttler.guard.js';
import { ConfigModule } from './config/config.module.js';
import { ENV, type Env } from './config/env.js';
import { DbModule } from './db/db.module.js';
import { HealthController } from './health.controller.js';
import { PricingModule } from './pricing/pricing.module.js';
import { QuotesModule } from './quotes/quotes.module.js';
import { ShopsModule } from './shops/shops.module.js';
import { StorageModule } from './storage/storage.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule,
    DbModule,
    StorageModule,
    AiModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ENV],
      useFactory: (env: Env) => ({ secret: env.JWT_SECRET, signOptions: { algorithm: 'HS256' } }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        throttlers: [{ ttl: 60_000, limit: 120 }],
        skipIf: () => env.NODE_ENV === 'test',
      }),
    }),
    AuthModule,
    ShopsModule,
    UsersModule,
    CatalogModule,
    PricingModule,
    QuotesModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ClientIpThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
