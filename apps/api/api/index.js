// نقطة الدخول على Vercel: نفس التطبيق اللي في src/main.ts بس من غير listen،
// وVercel بيبعت كل الطلبات هنا (شوف vercel.json). بيستخدم البناء اللي في dist.

let appPromise;

async function createApp() {
  const [{ NestFactory }, { AppModule }, { configureApp }, { loadEnv }] = await Promise.all([
    import('@nestjs/core'),
    import('../dist/app.module.js'),
    import('../dist/configure-app.js'),
    import('../dist/config/env.js'),
  ]);
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
  let app;
  try {
    app = await appPromise;
  } catch (error) {
    // مؤقت لحد ما الديبلوي يشتغل: سبب فشل التشغيل بيظهر في الرد (أسماء متغيرات مش قيمها)
    console.error(error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    const runtime = `node ${process.version}, require_module=${String(process.features.require_module)}`;
    res.end(`startup failed (${runtime}):\n${error instanceof Error ? error.message : String(error)}`);
    return;
  }
  return app(req, res);
}
