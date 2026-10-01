# سِجاف

نظام تسعير لمحلات الستائر: صوّر الستارة، والذكاء الاصطناعي يحدد الموديل والخامات، والسعر يتحسب من كتالوج المحل بتلات مستويات.

| المجلد | إيه هو |
|---|---|
| `apps/web` | Next.js 16 — الواجهة (عربي، RTL، PWA) |
| `apps/api` | NestJS 12 — الـ API وقاعدة البيانات والصلاحيات |
| `packages/shared` | Zod schemas وtypes مشتركة |
| `design/sijaf-html` | التصميم المرجعي (48 شاشة) |

## التشغيل محليًا

```bash
npm install
cp apps/api/.env.example apps/api/.env          # DATABASE_URL, DIRECT_URL, JWT_SECRET, INTERNAL_API_SECRET
cp apps/web/.env.example apps/web/.env.local    # API_BASE_URL, INTERNAL_API_SECRET (نفس القيمة)
npm run db:migrate
npm run dev        # web: http://localhost:3000 · api: http://localhost:4000
```

`npm run lint` · `npm run typecheck` · `npm test`

## النشر على Vercel

مشروعين على Vercel من نفس الـ repo. Vercel بيعمل `npm install` من الـ root (npm workspaces)، والـ `postinstall` بيبني `@sijaf/shared`.

### 1. الـ API

- **Root Directory:** `apps/api` — Framework: NestJS (بيتعرف لوحده من `src/main.ts`)
- **Environment Variables:**
  - `DATABASE_URL` — Supabase transaction pooler (port 6543)
  - `JWT_SECRET` — 32 حرف عشوائي على الأقل
  - `INTERNAL_API_SECRET` — 32 حرف عشوائي على الأقل (نفس القيمة في الويب)
  - `SUPABASE_URL` و`SUPABASE_SERVICE_ROLE_KEY` — لتخزين صور العروض (الـ bucket الخاص `quote-photos` بيتعمل لوحده)
  - `ANTHROPIC_API_KEY` (و`ANTHROPIC_MODEL` اختياري، الافتراضي `claude-opus-5`) — لتحليل الصور
- الـ migrations مابتتطبقش وقت الـ deploy؛ طبّقها من جهازك قبلها: `npm run db:migrate` (بيستخدم `DIRECT_URL`).
- اتأكد إن `https://<api>.vercel.app/health` بيرجّع `{"status":"ok"}`.

### 2. الويب

- **Root Directory:** `apps/web` — Framework: Next.js
- **Environment Variables:**
  - `API_BASE_URL` — رابط مشروع الـ API (من غير `/` في الآخر)
  - `INTERNAL_API_SECRET` — نفس قيمة الـ API
  - `NEXT_PUBLIC_APP_URL` — رابط الويب النهائي
- الـ PDF بيتعمل بـ Chromium جوه الـ function (`@sparticuz/chromium`)؛ لو ظهر خطأ ذاكرة زوّد الـ Memory للـ function لـ 1024MB أو أكتر.

> لو الباسورد بتاعة قاعدة البيانات فيها `@` أو `#` لازم تتكتب encoded في الرابط (`@` ← `%40`).
