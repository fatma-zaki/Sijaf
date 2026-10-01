@apps/web/AGENTS.md

# سِجاف

نظام SaaS لمحلات الستائر في مصر. صاحب المحل أو الفني بيصوّر الستارة ويكتب المقاس، والذكاء الاصطناعي بيحدد الموديل والخامات، والسعر بيتحسب بمعادلات ثابتة من كتالوج المحل. النتيجة 3 مستويات: اقتصادي ومتوسط وفاخر. المستخدمين صاحب المحل والفنيين بس.

## الهيكل (npm workspaces)

```
apps/web         Next.js 16 (App Router) — الواجهة
apps/api         NestJS 12 (ESM) — الـ API، قاعدة البيانات، الصلاحيات، Claude
packages/shared  @sijaf/shared — Zod schemas وtypes مشتركة بين الناحيتين
design/          التصميم (مصدر الحقيقة للشكل)
```

- **الـ validation بيتكتب مرة واحدة** في `packages/shared`، والفرونت (React Hook Form) والباك (`ZodPipe`) بيستخدموا نفس الـ schema. رسائل الأخطاء بالعربي جوه الـ schema.
- الـ shared بيتبني لـ `dist` (ESM)؛ `npm run dev` بيبنيه ويراقبه. لو غيّرت فيه من غير dev شغّال: `npm run build -w @sijaf/shared`.
- الـ imports جوه `apps/api` و`packages/shared` لازم تنتهي بـ `.js` (nodenext).

## الباك (`apps/api`)

- قاعدة البيانات Supabase Postgres عن طريق Drizzle (`src/db/schema.ts`). الـ migrations في `apps/api/drizzle/`:
  `npm run db:generate -w @sijaf/api -- --name <اسم>` ثم `npm run db:migrate`.
- `DATABASE_URL` = transaction pooler (6543، `prepare: false`)، `DIRECT_URL` = session pooler للـ migrations. الباسورد لو فيها `@` تتكتب `%40`.
- **كل جدول عليه RLS من غير policies** (`.enableRLS()`) عشان الـ REST API بتاع Supabase مايكشفش حاجة. العزل بين المحلات في الـ API: **كل query لازم تتقيد بـ `shopId` من التوكن** (`@CurrentUser()`)، ومفيش endpoint بياخد shopId من الـ body أو الـ URL.
- Auth في Nest نفسه: موبايل + كلمة سر (bcrypt)، access JWT (15 دقيقة) + refresh token عشوائي بيتغيّر مع كل استخدام؛ لو اتستخدم توكن قديم الـ family كلها بتتلغي.
- كل endpoint محمي افتراضيًا (`AuthGuard` global)؛ `@Public()` للاستثناءات و`@Roles('owner')` لصاحب المحل.
- **الفني مابيشوفش `purchase_price` ولا هامش الربح**: الـ DTOs بتتبني يدوي (`common/dto.ts`) ومابترجعش أعمدة حساسة؛ الأسعار الحساسة هتبقى في جداول/DTOs لصاحب المحل بس.
- التيستات e2e على PGlite (Postgres في الذاكرة) بنفس الـ migrations: `test/test-app.ts`. أي endpoint جديد ليه تيست صلاحيات وعزل محلات.
- Claude API من الباك بس (`src/ai/`)، واسم الموديل من `ANTHROPIC_MODEL`. التحليل بـ `messages.parse` + `zodOutputFormat` (structured outputs؛ مفيش min/max للأرقام فالثقة بتتقصّ بعد الرد). أي فشل بيرجع حالة (`unavailable`/`failed`/`unclear`…) مش exception، والعرض دايمًا يقدر يكمل يدوي. التيستات بتستخدم `FakeAnalyzer` و`MemoryStorage` (`test/test-app.ts`) ومابتكلمش Claude.
- **الذكاء الاصطناعي مابيحسبش أسعار**: بيوصف الصورة بس، و`quotes/analysis-mapping.ts` بيختار من كتالوج المحل، والأسعار من محرك التسعير.
- محرك التسعير (`packages/shared/src/pricing/engine.ts`) هو المصدر الوحيد للأسعار: الويب بيشغّله للمعاينة الفورية، والـ API بيعيد الحساب بيه وقت الحفظ ومابيثقش في أرقام جاية من المتصفح (بيستقبل المستوى والتعديلات والخصم بس).
- صور العروض في `FileStorage` (Supabase Storage في الإنتاج، `.uploads/` محليًا)، وبتتقري من الـ API بتوكن المستخدم؛ الويب بيعدّيها من `app/api/quotes/[id]/photos`.
- الكتالوج (`src/catalog/`): `purchase_price` في `materials` بيطلع في `MaterialDto` لصاحب المحل بس؛ الفني بياخد `MaterialPublicDto` من `/materials/options`. أي endpoint جديد بيرجّع خامات لازم يفرّق بالـ role، وليه تيست إن الفني مايشوفش سعر الشراء.
- القوالب («ابدأ بأسعار نموذجية» و«8 موديلات جاهزة») في `src/catalog/templates.ts`؛ الموديلات بتتضاف لكل محل جديد عند التسجيل.
- مطابقة الأسماء العربي (موردين/خامات) بـ `arabicKey` من shared (بيوحّد أ/إ/آ وة/ه وى/ي).
- صفحة العميل: `src/quotes/public-*.ts` تحت `@Public()` بالـ `publicToken` العشوائي، وبترجع `PublicQuoteDto` بس (من غير موبايل العميل ولا الملاحظات ولا التكاليف ولا أسعار الوحدة). أي حقل جديد فيها ليه تيست إنه مش بيسرّب حاجة.
- سجل العرض (`quote_events`) بيتكتب من الـ service مع كل حدث؛ الويب بيحوّله لنصوص في `components/features/quotes/quote-events.ts`.
- التواريخ بتوقيت القاهرة (فيها توقيت صيفي): الأيام `YYYY-MM-DD` والساعات `HH:mm` بتتحول لـ UTC بـ `cairoToUtc` من shared (`time.ts`)، والأسبوع بيبدأ السبت (`weekStart`). أي query بفترة بتتحسب حدودها كده مش بـ `new Date()` على السيرفر.
- المواعيد (`src/schedule/`): كل الفريق بيشوفها، و`@Quoters()` بس اللي بيحدد/يعدّل. الفني في الرئيسية بيشوف مواعيده بس. الموعد المربوط بعرض بيكتب `appointment_scheduled` في سجله.
- التقارير (`/reports`) لصاحب المحل بس (فيها الربح من `quote_items.unit_cost`)؛ `/dashboard` و`/team` و`/clients` لكل الفريق ومن غير أسعار شراء.

## الفرونت (`apps/web`)

- المتصفح مابيكلمش Nest مباشرة. Server Components بتقرا بـ `apiRequest()` (`lib/api/server.ts`)، والتعديلات Server Actions بتلف في `runAction(schema, input, fn)` اللي بيعمل validation ويرجّع `ActionResult`.
- الجلسة في كوكيز httpOnly (`lib/auth/cookies.ts`). `src/proxy.ts` بيحمي الصفحات وبيجدد الـ access token بالـ refresh token قبل الرندر. `getSession()` / `requireOwner()` / `requireQuoter()` في `lib/auth/session.ts`.
- أخطاء الـ API بتتحط على حقول الفورم بـ `applyActionErrors()` (`lib/forms.ts`).
- الصلاحيات في الواجهة (`components/layout/nav-items.ts`) للعرض بس؛ الحماية الحقيقية في الباك وفي `require*()`.
- `Field` بياخد control واحد وبيربطه بالـ label بـ `htmlFor`/`id` (مش لافف عليه، عشان اسم الـ select مايبقاش فيه نصوص الاختيارات) وبالـ hint/الخطأ بـ `aria-describedby`.
- الفورمز اللي بتترندر على السيرفر ببيانات (تعديل) تستخدم `withDefault(form, name)` بدل `form.register(name)`، عشان القيم تظهر قبل ما الـ JS يحمّل.
- أي نافذة فيها فورم تستخدم `useId()` لـ id الفورم؛ ممكن يبقى فيه نسختين من نفس النافذة في الصفحة.
- الفلاتر والبحث في الـ URL (`useUrlParams`)، والصفحة تفضل Server Component.
- المكوّنات اللي بتتحط في أعمدة عرضها متغير تستخدم container queries (`@container` و`@min-[46rem]:`) مش breakpoints الشاشة.
- معادلات الأمتار والبنود الإضافية في `packages/shared/src/pricing` (functions نقية ومتختبرة)؛ الفرونت بيستخدمها للمعاينة والباك للحساب.
- الصور بتتضغط في المتصفح قبل الرفع (`lib/image/compress.ts`: JPEG، أطول ضلع 1400px) وبتترفع لـ route handler مش Server Action (حد الحجم).
- صفحة العميل `/q/[token]` (مفتوحة من غير دخول، noindex) وصورها من `/q/[token]/photo|logo`. «العميل فتح الرابط» بيتسجل من المتصفح (`OpenedBeacon`) مش من السيرفر، عشان معاينة الرابط في واتساب مابتتحسبش، ومابيتسجلش لو فيه جلسة حد من المحل.
- الـ PDF (`/q/[token]/pdf`) بيطبع `/q/[token]/print` بـ Chromium على السيرفر (`lib/pdf.ts`): على Vercel من `@sparticuz/chromium`، ومحليًا Edge/Chrome أو `CHROME_EXECUTABLE_PATH`. العرض نفسه مكوّن واحد `QuoteDocument` للصفحة والطباعة والتطبيق.

## التصميم

- `design/sijaf-html/` فيه 48 شاشة (لابتوب 1440، تابلت 820، موبايل 390).
- الـ tokens في `apps/web/src/app/globals.css` جوه `@theme` بنفس أسماء `sijaf.css`. الألوان والخطوط والـ radius والـ shadows الافتراضية بتاعة Tailwind **متشالة**.
- المسافات scale الـ 4px (`p-4` = 16px). أحجام الخط: `2xs` 11، `xs` 12، `sm` 13، `base` 14، `md` 15، `lead` 16، `lg` 17، `xl` 19، `2xl` 20، `title` 22، `3xl` 26، `4xl` 28، `display` 34.
- الـ breakpoints: من غير prefix = موبايل (< 600) + BottomNav. `md:` = تابلت + IconRail. `lg:` = لابتوب (> 1024) + Sidebar.
- ماتنسخش الـ inline styles من الـ HTML؛ `style` بس للقيم المتغيرة. الأيقونات من `lucide-react`، والشعار في `components/ui/logo.tsx`.
- `/design-system` بتعرض كل مكوّنات `components/ui`؛ أي مكوّن جديد يتضاف هناك.

## RTL والإتاحة

- `<html lang="ar" dir="rtl">`. logical properties بس (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`text-start`)؛ ESLint بيرفض `ml-`/`pr-`/`left-`/`text-right`…
- عناصر حقيقية (`button`/`a`/`label`)، `aria-label` للأزرار اللي فيها أيقونة بس، ومساحة لمس 44px (`touch-target`).

## التنسيق

- `apps/web/src/lib/format.ts`: `10,700 ج.م`، «اليوم - 10:24 ص» بتوقيت القاهرة.
- أرقام الموبايل بتتخزن `01xxxxxxxxx` وبتتعرض `0100 123 4567` (`formatEgyptianMobile`)؛ `normalizeEgyptianMobile` بيقبل مسافات و+20 وأرقام عربي.

## قواعد الكود

- TypeScript strict، وممنوع `any` (ESLint في الويب، oxlint في الـ API).
- Server Components هي الأساس، و`"use client"` بس للي فيه state أو effects أو browser APIs.
- مكوّنات صغيرة ومفيش تكرار؛ أي عنصر بيتكرر يبقى في `components/ui`. الـ imports من الملف مباشرة، مفيش barrel files في الويب.
- `cn()` من `lib/cn.ts` (tailwind-merge متظبط على أحجام سِجاف). لينك بشكل زرار: `buttonStyles()`.
- مفيش بيانات تجريبية في الكومبوننتس.

## الأوامر (من الـ root)

```
npm run dev          # shared (watch) + api :4000 + web :3000
npm run lint
npm run typecheck
npm test             # shared + api (e2e على PGlite) + web
npm run db:migrate   # يطبّق migrations على Supabase
```

- الإعدادات: `apps/api/.env` و`apps/web/.env.local` (انسخ من `.env.example`). Next بيقرا `.env.local` وقت التشغيل، فلو اتغيّر أعد تشغيل `npm run dev`.
- Vitest بيشتغل بـ threads pool (forks بيعمل timeout على Windows).

بعد كل مرحلة شغّل lint وtypecheck والتيستات قبل ما تقول إنها خلصت.
