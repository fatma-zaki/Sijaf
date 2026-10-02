// نقطة الدخول على Vercel: نفس التطبيق اللي في src/main.ts بس من غير listen،
// وVercel بيبعت كل الطلبات هنا (شوف vercel.json). بيستخدم البناء اللي في dist.
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module.js';
import { configureApp } from '../dist/configure-app.js';
import { loadEnv } from '../dist/config/env.js';

let appPromise;

async function createApp() {
  loadEnv();
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  configureApp(app);
  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req, res) {
  // التطبيق بيتبني مرة واحدة لكل instance، ولو فشل المحاولة الجاية تبنيه من الأول
  appPromise ??= createApp().catch((error) => {
    appPromise = undefined;
    throw error;
  });
  const app = await appPromise;
  return app(req, res);
}
