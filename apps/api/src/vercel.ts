import type { IncomingMessage, ServerResponse } from 'node:http';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';
import { loadEnv } from './config/env.js';

type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

/**
 * نفس التطبيق اللي في main.ts بس من غير listen، لـ Vercel (api/index.js).
 * بيتبني مرة واحدة لكل instance، ولو فشل المحاولة الجاية تبنيه من الأول.
 */
let appPromise: Promise<RequestHandler> | undefined;

async function createApp(): Promise<RequestHandler> {
  loadEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error', 'warn'] });
  configureApp(app);
  await app.init();
  return app.getHttpAdapter().getInstance() as RequestHandler;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  appPromise ??= createApp().catch((error: unknown) => {
    appPromise = undefined;
    throw error;
  });
  const app = await appPromise;
  app(req, res);
}
