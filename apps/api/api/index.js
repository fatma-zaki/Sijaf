// نقطة الدخول على Vercel: Vercel بيبعت كل الطلبات هنا (شوف vercel.json).
// التطبيق نفسه في src/vercel.ts، ومتجمّع في dist-vercel بـ scripts/bundle-vercel.mjs.

let handlerPromise;

export default async function handler(req, res) {
  handlerPromise ??= import('../dist-vercel/handler.mjs').then((module) => module.default);
  try {
    const appHandler = await handlerPromise;
    await appHandler(req, res);
  } catch (error) {
    handlerPromise = undefined;
    // مؤقت لحد ما الديبلوي يشتغل: سبب فشل التشغيل بيظهر في الرد (أسماء متغيرات مش قيمها)
    console.error(error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(`startup failed (node ${process.version}):\n${error instanceof Error ? error.message : String(error)}`);
  }
}
