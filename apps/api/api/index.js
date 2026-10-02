// نقطة الدخول على Vercel: Vercel بيبعت كل الطلبات هنا (شوف vercel.json).
// التطبيق نفسه في src/vercel.ts، ومتجمّع في dist-vercel بـ scripts/bundle-vercel.mjs.

let handlerPromise;

export default async function handler(req, res) {
  handlerPromise ??= import('../dist-vercel/handler.mjs').then((module) => module.default);
  try {
    const appHandler = await handlerPromise;
    await appHandler(req, res);
  } catch (error) {
    // فشل التشغيل (غالبًا متغير بيئة ناقص): السبب في Logs بتاعة Vercel، والطلب الجاي يجرب تاني
    handlerPromise = undefined;
    console.error(error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ statusCode: 500, message: 'Internal server error' }));
  }
}
