// بيجمّع الـ API (بعد nest build) في ملف ESM واحد لـ Vercel.
// السبب: @nestjs/throttler لسه CommonJS وبيعمل require() لـ @nestjs/common اللي بقى ESM بس،
// وده مابيشتغلش على runtime بتاع Vercel. جوه الـ bundle الـ require بيبقى كود عادي في نفس الملف.
import { build } from 'esbuild';

await build({
  entryPoints: ['dist/vercel.js'],
  outfile: 'dist-vercel/handler.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  // باكدجات Nest الاختيارية اللي مش متسطبة؛ Nest بيجربها جوه try وبيكمل من غيرها
  external: ['@nestjs/microservices', '@nestjs/websockets', 'class-transformer', 'class-validator'],
  // الكود الـ CommonJS جوه الـ bundle محتاج require و__dirname
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      "import { fileURLToPath as __fileURLToPath } from 'node:url';",
      "import { dirname as __pathDirname } from 'node:path';",
      'const require = __createRequire(import.meta.url);',
      'const __filename = __fileURLToPath(import.meta.url);',
      'const __dirname = __pathDirname(__filename);',
    ].join('\n'),
  },
  logLevel: 'warning',
});
