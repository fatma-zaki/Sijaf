import type { AnalyzeResultDto, AuthTokens, MeDto, QuoteDto } from '@sijaf/shared';
import type { CurtainAnalysis } from '../src/ai/analysis.schema.js';
import { bearer, nextPhone, type TestApp } from './test-app.js';

// أصغر JPEG صالح (SOI + APP0 + EOI) يكفي للتحقق من النوع
export const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);

/** ستارة التصميم: ويفي قطيفة وشيفون وبطانة ومجرى مزدوج */
export const designAnalysis: CurtainAnalysis = {
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

export async function shopWithCatalog(t: TestApp, register: (t: TestApp) => Promise<AuthTokens>): Promise<AuthTokens> {
  const owner = await register(t);
  await t.http().post('/catalog/template').set(bearer(owner)).expect(200);
  return owner;
}

/** عرض متسعّر بالمستوى المتوسط (من صورة متحللة) */
export async function pricedQuote(t: TestApp, owner: AuthTokens, client: { name?: string; phone?: string } = {}): Promise<QuoteDto> {
  const created = (
    await t
      .http()
      .post('/quotes')
      .set(bearer(owner))
      .send({ clientName: client.name ?? 'أحمد محمد', clientPhone: client.phone ?? nextPhone(), roomLabel: 'صالون' })
      .expect(201)
  ).body as QuoteDto;
  await t.http().post(`/quotes/${created.id}/photos`).set(bearer(owner)).attach('photo', JPEG, { filename: 'c.jpg', contentType: 'image/jpeg' }).expect(201);
  t.analyzer.next = { status: 'ok', result: designAnalysis };
  const { quote } = (await t.http().post(`/quotes/${created.id}/analyze`).set(bearer(owner)).expect(200)).body as AnalyzeResultDto;
  await t
    .http()
    .put(`/quotes/${quote.id}/details`)
    .set(bearer(owner))
    .send({
      modelId: quote.modelId,
      widthCm: 300,
      heightCm: 260,
      roomLabel: 'صالون',
      components: quote.components.map(({ slot, materialId, included }) => ({ slot, materialId, included })),
    })
    .expect(200);
  return (
    await t
      .http()
      .put(`/quotes/${quote.id}/pricing`)
      .set(bearer(owner))
      .send({ tier: 'standard', edits: { overrides: {}, removed: [], manual: [] } })
      .expect(200)
  ).body as QuoteDto;
}

export async function me(t: TestApp, tokens: AuthTokens): Promise<MeDto> {
  return (await t.http().get('/me').set(bearer(tokens)).expect(200)).body as MeDto;
}
