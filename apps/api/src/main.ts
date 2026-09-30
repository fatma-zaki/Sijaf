import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { loadEnv } from './config/env.js';

try {
  process.loadEnvFile('.env');
} catch {
  // في الإنتاج المتغيرات جاية من البيئة
}

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // على Vercel الطلب بيعدّي على proxy بتاعهم؛ محليًا مفيش proxy
  app.set('trust proxy', process.env.VERCEL ? true : 'loopback');
  app.enableShutdownHooks();
  await app.listen(env.PORT);
}
await bootstrap();
