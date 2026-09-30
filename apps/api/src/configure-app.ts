import type { NestExpressApplication } from '@nestjs/platform-express';

/** إعدادات مشتركة بين التشغيل والتيستات */
export function configureApp(app: NestExpressApplication): void {
  // استيراد شيت Excel ممكن يبقى أكبر من الـ 100kb الافتراضية
  app.useBodyParser('json', { limit: '2mb' });
  // على Vercel الطلب بيعدّي على proxy بتاعهم؛ محليًا مفيش proxy
  app.set('trust proxy', process.env.VERCEL ? true : 'loopback');
}
