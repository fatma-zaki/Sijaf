import type {
  AnalyzeResultDto,
  AuthTokens,
  CurtainModelDto,
  MaterialDto,
  PricingContextDto,
  QuoteDto,
} from '@sijaf/shared';
import { and, eq } from 'drizzle-orm';
import type { CurtainAnalysis } from '../src/ai/analysis.schema.js';
import { quoteEvents, quoteItems } from '../src/db/schema.js';
import { addTechnician, bearer, createTestApp, nextPhone, registerShop, type TestApp } from './test-app.js';

// أصغر JPEG صالح (SOI + APP0 + EOI) يكفي للتحقق من النوع
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);

const designAnalysis: CurtainAnalysis = {
  is_curtain: true,
  image_quality: 'clear',
  style: 'wave',
  fabric_look: 'velvet',
  has_sheer: true,
  has_main: true,
  lining_likely: true,
  track: 'double',
  valance: false,
  color: 'بيج',
  confidence: { style: 90, fabric_look: 88, sheer: 92, main: 95, lining: 85, track: 78, valance: 64 },
  notes: 'الستارة قريبة من الأرض',
};

describe('quotes (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.close();
  });

  /** محل بالأسعار النموذجية */
  async function shopWithCatalog(): Promise<AuthTokens> {
    const owner = await registerShop(t);
    await t.http().post('/catalog/template').set(bearer(owner)).expect(200);
    return owner;
  }

  async function createQuote(owner: AuthTokens, phone = nextPhone()): Promise<QuoteDto> {
    const res = await t
      .http()
      .post('/quotes')
      .set(bearer(owner))
      .send({ clientName: 'أحمد محمد', clientPhone: phone, area: 'المعادي', roomLabel: 'غرفة نوم' })
      .expect(201);
    return res.body as QuoteDto;
  }

  const upload = (owner: AuthTokens, id: string, bytes = JPEG) =>
    t.http().post(`/quotes/${id}/photos`).set(bearer(owner)).attach('photo', bytes, { filename: 'curtain.jpg', contentType: 'image/jpeg' });

  async function materialId(owner: AuthTokens, name: string): Promise<string> {
    const options = (await t.http().get('/materials/options').set(bearer(owner)).expect(200)).body as MaterialDto[];
    const found = options.find((m) => m.name === name);
    if (!found) throw new Error(`no material ${name}`);
    return found.id;
  }

  async function modelId(owner: AuthTokens, name: string): Promise<string> {
    const models = (await t.http().get('/models').set(bearer(owner)).expect(200)).body as CurtainModelDto[];
    const found = models.find((m) => m.name === name);
    if (!found) throw new Error(`no model ${name}`);
    return found.id;
  }

  describe('creating', () => {
    it('numbers quotes per shop and reuses the client by phone', async () => {
      const owner = await shopWithCatalog();
      const phone = nextPhone();
      const first = await createQuote(owner, phone);
      const second = await createQuote(owner, phone);
      expect([first.number, second.number]).toEqual([1001, 1002]);
      expect(first.status).toBe('draft');
      expect(second.client.id).toBe(first.client.id);
      expect(first.client).toMatchObject({ name: 'أحمد محمد', phone, area: 'المعادي' });
      expect(first.depositPercent).toBe(30);

      const other = await shopWithCatalog();
      expect((await createQuote(other, phone)).number).toBe(1001);
    });

    it('validates the client in Arabic', async () => {
      const owner = await registerShop(t);
      const res = await t.http().post('/quotes').set(bearer(owner)).send({ clientName: '', clientPhone: '123' }).expect(400);
      expect(res.body.fieldErrors).toMatchObject({ clientName: 'اكتب اسم العميل', clientPhone: 'رقم الموبايل لازم يبقى 11 رقم ويبدأ بـ 01' });
    });
  });

  describe('photos', () => {
    it('stores real images only, up to four, and serves them back', async () => {
      const owner = await registerShop(t);
      const quote = await createQuote(owner);
      expect(((await upload(owner, quote.id).expect(201)).body as QuoteDto).photoCount).toBe(1);
      const photo = await t.http().get(`/quotes/${quote.id}/photos/0`).set(bearer(owner)).expect(200);
      expect(photo.headers['content-type']).toBe('image/jpeg');
      expect(Buffer.compare(photo.body as Buffer, JPEG)).toBe(0);

      const fake = await upload(owner, quote.id, Buffer.from('not an image at all')).expect(400);
      expect(fake.body.message).toBe('الملف لازم يبقى صورة JPG أو PNG');
      for (let i = 0; i < 3; i += 1) await upload(owner, quote.id).expect(201);
      await upload(owner, quote.id).expect(400);
      await t.http().get(`/quotes/${quote.id}/photos/9`).set(bearer(owner)).expect(404);
    });
  });

  describe('analysis', () => {
    it('maps the photo to the shop models and catalog', async () => {
      const owner = await shopWithCatalog();
      const quote = await createQuote(owner);
      await upload(owner, quote.id).expect(201);
      t.analyzer.next = { status: 'ok', result: designAnalysis };

      const { status, quote: analyzed } = (await t.http().post(`/quotes/${quote.id}/analyze`).set(bearer(owner)).expect(200)).body as AnalyzeResultDto;
      expect(status).toBe('ok');
      expect(analyzed).toMatchObject({ modelName: 'ويفي (موجة)', modelSource: 'ai', modelConfidence: 90, operation: 'manual' });
      expect(analyzed.analysis).toMatchObject({ status: 'ok', color: 'بيج', notes: 'الستارة قريبة من الأرض' });

      const names = new Map(((await t.http().get('/materials/options').set(bearer(owner))).body as MaterialDto[]).map((m) => [m.id, m.name]));
      expect(analyzed.components.map((c) => [c.slot, c.materialId ? names.get(c.materialId) : null, c.included, c.source])).toEqual([
        ['sheer', 'شيفون لينين', true, 'ai'],
        ['main', 'قطيفة تركي', true, 'ai'],
        ['lining', 'بطانة عادية', true, 'ai'],
        ['track', 'مجرى ألومنيوم تقيل', true, 'ai'],
        ['cornice', 'كرنيشة (بلمت)', false, 'ai'],
      ]);
    });

    it.each([
      [{ status: 'ok' as const, result: { ...designAnalysis, is_curtain: false } }, 'not_curtain'],
      [{ status: 'ok' as const, result: { ...designAnalysis, image_quality: 'unclear' as const } }, 'unclear'],
      [{ status: 'refused' as const }, 'unclear'],
      [{ status: 'unavailable' as const }, 'unavailable'],
      [{ status: 'failed' as const }, 'failed'],
    ])('reports %j as %s without picking anything', async (outcome, expected) => {
      const owner = await shopWithCatalog();
      const quote = await createQuote(owner);
      await upload(owner, quote.id).expect(201);
      t.analyzer.next = outcome;
      const body = (await t.http().post(`/quotes/${quote.id}/analyze`).set(bearer(owner)).expect(200)).body as AnalyzeResultDto;
      expect(body.status).toBe(expected);
      expect(body.quote.components).toEqual([]);
      expect(body.quote.modelId).toBeNull();
    });

    it('analyzes the latest photo after a retake', async () => {
      const owner = await shopWithCatalog();
      const quote = await createQuote(owner);
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
      await upload(owner, quote.id).expect(201);
      await upload(owner, quote.id, png).expect(201);
      let seen = '';
      const original = t.analyzer.analyze.bind(t.analyzer);
      t.analyzer.analyze = (image) => {
        seen = image?.contentType ?? "";
        return original();
      };
      await t.http().post(`/quotes/${quote.id}/analyze`).set(bearer(owner)).expect(200);
      t.analyzer.analyze = original;
      expect(seen).toBe('image/png');
    });

    it('skips the analysis when there is no photo', async () => {
      const owner = await registerShop(t);
      const quote = await createQuote(owner);
      const calls = t.analyzer.calls;
      const body = (await t.http().post(`/quotes/${quote.id}/analyze`).set(bearer(owner)).expect(200)).body as AnalyzeResultDto;
      expect(body.status).toBe('skipped');
      expect(t.analyzer.calls).toBe(calls);
    });
  });

  describe('details and pricing', () => {
    async function analyzedQuote(owner: AuthTokens) {
      const quote = await createQuote(owner);
      await upload(owner, quote.id).expect(201);
      t.analyzer.next = { status: 'ok', result: designAnalysis };
      return ((await t.http().post(`/quotes/${quote.id}/analyze`).set(bearer(owner)).expect(200)).body as AnalyzeResultDto).quote;
    }

    const details = (quote: QuoteDto, overrides: Record<string, unknown> = {}) => ({
      modelId: quote.modelId,
      operation: 'manual',
      widthCm: 300,
      heightCm: 260,
      windowCount: 1,
      roomLabel: 'غرفة نوم',
      components: quote.components.map(({ slot, materialId, included }) => ({ slot, materialId, included })),
      optionalItemIds: [],
      ...overrides,
    });

    it('needs the details before pricing', async () => {
      const owner = await shopWithCatalog();
      const quote = await createQuote(owner);
      const res = await t.http().get(`/quotes/${quote.id}/pricing-context`).set(bearer(owner)).expect(400);
      expect(res.body.message).toBe('كمّل تفاصيل العرض الأول (الموديل والمقاسات)');
    });

    it('marks changed components as manual and logs the change', async () => {
      const owner = await shopWithCatalog();
      const quote = await analyzedQuote(owner);
      const satin = await materialId(owner, 'ساتان تركي');
      const components = quote.components.map(({ slot, materialId: id, included }) => ({ slot, included, materialId: slot === 'main' ? satin : id }));

      const saved = (await t.http().put(`/quotes/${quote.id}/details`).set(bearer(owner)).send(details(quote, { components })).expect(200)).body as QuoteDto;
      const main = saved.components.find((c) => c.slot === 'main');
      expect(main).toMatchObject({ materialId: satin, source: 'manual', confidence: 88 });
      expect(saved.components.find((c) => c.slot === 'sheer')?.source).toBe('ai');
      expect(saved).toMatchObject({ widthCm: 300, heightCm: 260, windowCount: 1 });

      const events = await t.db.select().from(quoteEvents).where(and(eq(quoteEvents.quoteId, quote.id), eq(quoteEvents.type, 'component_changed')));
      expect(events[0].payload).toEqual({ slot: 'main', label: 'القماش الأساسي', from: 'قطيفة تركي', to: 'ساتان تركي' });

      // رجوع لاقتراح الذكاء الاصطناعي = «من الذكاء الاصطناعي» تاني
      const back = (await t.http().put(`/quotes/${quote.id}/details`).set(bearer(owner)).send(details(quote)).expect(200)).body as QuoteDto;
      expect(back.components.find((c) => c.slot === 'main')?.source).toBe('ai');
    });

    it('rejects materials in the wrong slot and models from other shops', async () => {
      const owner = await shopWithCatalog();
      const quote = await analyzedQuote(owner);
      const rail = await materialId(owner, 'مجرى ألومنيوم تقيل');
      const components = [{ slot: 'main', materialId: rail, included: true }];
      const wrongSlot = await t.http().put(`/quotes/${quote.id}/details`).set(bearer(owner)).send(details(quote, { components })).expect(400);
      expect(wrongSlot.body.fieldErrors).toEqual({ 'components.0.materialId': 'اختار خامة من القايمة' });

      const other = await shopWithCatalog();
      const foreignModel = await modelId(other, 'رومانية');
      const res = await t.http().put(`/quotes/${quote.id}/details`).set(bearer(owner)).send(details(quote, { modelId: foreignModel })).expect(400);
      expect(res.body.fieldErrors).toEqual({ modelId: 'اختار موديل من القايمة' });
    });

    it('prices with the shared engine, applies edits, and keeps purchase costs internal', async () => {
      const owner = await shopWithCatalog();
      const quote = await analyzedQuote(owner);
      await t.http().put(`/quotes/${quote.id}/details`).set(bearer(owner)).send(details(quote)).expect(200);

      const context = (await t.http().get(`/quotes/${quote.id}/pricing-context`).set(bearer(owner)).expect(200)).body as PricingContextDto;
      expect(context.tier).toBe('standard');
      expect(Object.keys(context.input.selections).sort()).toEqual(['lining', 'main', 'sheer', 'track']);

      const priced = (await t
        .http()
        .put(`/quotes/${quote.id}/pricing`)
        .set(bearer(owner))
        .send({ tier: 'standard', edits: { overrides: {}, removed: [], manual: [] }, discount: 0 })
        .expect(200)).body as QuoteDto;
      expect(priced.items.map((i) => [i.label, i.quantityLabel, i.total])).toEqual([
        ['شيفون لينين', '9 م', 2610],
        ['قطيفة تركي', '9 م', 5040],
        ['بطانة عادية', '9 م', 630],
        ['خياطة وتفصيل', '18 م', 1260],
        ['مجرى مزدوج', '2 × 3.5 م', 1540],
        ['شريط ويفي', '9 م', 225],
        ['تركيب', '1', 250],
      ]);
      expect(priced).toMatchObject({ tier: 'standard', status: 'review', subtotal: 11555, total: 11555, depositAmount: 3467 });
      expect(priced.validUntil).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(priced.items[0]).not.toHaveProperty('unitCost');

      // سعر الشراء بيتحفظ للتقارير
      const [stored] = await t.db.select().from(quoteItems).where(and(eq(quoteItems.quoteId, quote.id), eq(quoteItems.key, 'fabric:main')));
      expect(stored.unitCost).toBe(415);

      const edited = (await t
        .http()
        .put(`/quotes/${quote.id}/pricing`)
        .set(bearer(owner))
        .send({
          tier: 'economy',
          edits: {
            overrides: { labor: { quantity: 9 }, 'not-a-line': { quantity: 1 } },
            removed: ['installation'],
            manual: [{ key: 'x', label: 'فك ستارة قديمة', quantity: 1, unitPrice: 150 }],
          },
          discount: 100,
        })
        .expect(200)).body as QuoteDto;
      expect(edited.tier).toBe('economy');
      expect(edited.items.find((i) => i.key === 'labor')).toMatchObject({ quantity: 9, isEdited: true, originalQuantity: 18 });
      expect(edited.items.some((i) => i.key === 'installation')).toBe(false);
      expect(edited.items.at(-1)).toMatchObject({ key: 'manual:1', label: 'فك ستارة قديمة', source: 'manual', total: 150 });
      expect(edited.total).toBe(edited.subtotal - 100);
    });

    it('re-prices automatically when the details change after pricing', async () => {
      const owner = await shopWithCatalog();
      const quote = await analyzedQuote(owner);
      await t.http().put(`/quotes/${quote.id}/details`).set(bearer(owner)).send(details(quote)).expect(200);
      await t
        .http()
        .put(`/quotes/${quote.id}/pricing`)
        .set(bearer(owner))
        .send({ tier: 'standard', edits: { overrides: {}, removed: [], manual: [] }, discount: 0 })
        .expect(200);
      const twoWindows = (await t.http().put(`/quotes/${quote.id}/details`).set(bearer(owner)).send(details(quote, { windowCount: 2 })).expect(200))
        .body as QuoteDto;
      expect(twoWindows.subtotal).toBe(11555 * 2);
    });
  });

  describe('permissions and isolation', () => {
    it('allows owners and quoting technicians only, within their shop', async () => {
      const owner = await shopWithCatalog();
      const quote = await createQuote(owner);

      const inspector = await addTechnician(t, owner, true);
      expect(((await t.http().get(`/quotes/${quote.id}`).set(bearer(inspector)).expect(200)).body as QuoteDto).number).toBe(quote.number);
      await t.http().post('/quotes').set(bearer(inspector)).send({ clientName: 'سارة علي', clientPhone: nextPhone() }).expect(201);

      const installer = await addTechnician(t, owner, false);
      await t.http().get(`/quotes/${quote.id}`).set(bearer(installer)).expect(403);
      await t.http().post('/quotes').set(bearer(installer)).send({ clientName: 'سارة علي', clientPhone: nextPhone() }).expect(403);

      const otherShop = await registerShop(t);
      await t.http().get(`/quotes/${quote.id}`).set(bearer(otherShop)).expect(404);
      await upload(otherShop, quote.id).expect(404);
      await t.http().post(`/quotes/${quote.id}/analyze`).set(bearer(otherShop)).expect(404);
    });
  });
});
