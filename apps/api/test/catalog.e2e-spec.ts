import type {
  AuthTokens,
  CatalogCountsDto,
  CurtainModelDto,
  MaterialDto,
  MaterialImportResult,
  MaterialListDto,
  SupplierDto,
  TemplateApplyResult,
} from '@sijaf/shared';
import { addTechnician, bearer, createTestApp, registerShop, type TestApp } from './test-app.js';

const velvet = {
  name: 'قطيفة تركي',
  layer: 'main',
  look: 'قطيفة',
  tier: 'standard',
  unit: 'meter',
  supplierCode: 'VT-208',
  purchasePrice: 415,
  sellPrice: 560,
  topWidthM: 3,
};

describe('catalog (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.close();
  });

  const counts = async (owner: AuthTokens) =>
    (await t.http().get('/catalog/counts').set(bearer(owner)).expect(200)).body as CatalogCountsDto;

  it('gives every new shop the 8 ready models', async () => {
    const owner = await registerShop(t);
    expect(await counts(owner)).toEqual({ materials: 0, suppliers: 0, models: 8 });
    const models = (await t.http().get('/models').set(bearer(owner)).expect(200)).body as CurtainModelDto[];
    const waveMotor = models.find((model) => model.name === 'ويفي بريموت');
    expect(waveMotor).toMatchObject({ operation: 'motorized', fullness: 2.3, laborPerUnit: 85 });
    expect(waveMotor?.items.map((item) => [item.label, item.price, item.materialId])).toContainEqual(['موتور مجرى ويفي', 3800, null]);
  });

  describe('template prices', () => {
    it('adds suppliers and materials, links model items and completes the prices step', async () => {
      const owner = await registerShop(t);
      const result = (await t.http().post('/catalog/template').set(bearer(owner)).expect(200)).body as TemplateApplyResult;
      expect(result).toMatchObject({ materials: 31, suppliers: 5 });
      expect(result.linkedItems).toBeGreaterThan(0);
      expect(await counts(owner)).toEqual({ materials: 31, suppliers: 5, models: 8 });

      const models = (await t.http().get('/models').set(bearer(owner)).expect(200)).body as CurtainModelDto[];
      const motor = models.find((model) => model.name === 'ويفي بريموت')?.items.find((item) => item.label === 'موتور مجرى ويفي');
      expect(motor).toMatchObject({ price: 3800, supplierName: 'الأمل للمجاري والإكسسوارات' });
      expect(motor?.materialId).toBeTruthy();

      const me = (await t.http().get('/me').set(bearer(owner)).expect(200)).body;
      expect(me.shop.completedSteps).toContain('prices');

      await t.http().post('/catalog/template').set(bearer(owner)).expect(409);
    });
  });

  describe('materials', () => {
    it('lists with filters, facets and pagination', async () => {
      const owner = await registerShop(t);
      await t.http().post('/catalog/template').set(bearer(owner)).expect(200);

      const all = (await t.http().get('/materials?pageSize=12').set(bearer(owner)).expect(200)).body as MaterialListDto;
      expect(all.total).toBe(31);
      expect(all.items).toHaveLength(12);
      expect(all.facets.layers).toMatchObject({ sheer: 3, main: 15, lining: 3, track: 4 });

      const sheer = (await t.http().get('/materials?layer=sheer').set(bearer(owner)).expect(200)).body as MaterialListDto;
      expect(sheer.items.map((m) => m.name).sort()).toEqual(['شيفون تركي مطرز', 'شيفون سادة', 'شيفون لينين'].sort());
      // العدادات مابتتأثرش بفلتر الطبقة
      expect(sheer.facets.all).toBe(31);

      const premiumVelvet = (await t.http().get(`/materials?tier=premium&q=${encodeURIComponent('قطيفة')}`).set(bearer(owner)).expect(200))
        .body as MaterialListDto;
      expect(premiumVelvet.items.map((m) => m.name)).toEqual(['قطيفة إيطالي']);

      const anadol = all.facets.suppliers.find((s) => s.name === 'الأناضول للأقمشة');
      const bySupplier = (await t.http().get(`/materials?suppliers=${anadol?.id}`).set(bearer(owner)).expect(200)).body as MaterialListDto;
      expect(bySupplier.total).toBe(anadol?.count);
      expect(bySupplier.items.every((m) => m.supplierName === 'الأناضول للأقمشة')).toBe(true);

      await t.http().get('/materials?layer=wood').set(bearer(owner)).expect(400);
    });

    it('creates, updates and deletes a material', async () => {
      const owner = await registerShop(t);
      const supplier = (await t.http().post('/suppliers').set(bearer(owner)).send({ name: 'الأناضول للأقمشة' }).expect(201)).body as SupplierDto;
      const created = (await t.http().post('/materials').set(bearer(owner)).send({ ...velvet, supplierId: supplier.id }).expect(201))
        .body as MaterialDto;
      expect(created).toMatchObject({ name: 'قطيفة تركي', purchasePrice: 415, sellPrice: 560, supplierName: 'الأناضول للأقمشة' });

      const updated = (await t
        .http()
        .patch(`/materials/${created.id}`)
        .set(bearer(owner))
        .send({ ...velvet, supplierId: supplier.id, sellPrice: 590 })
        .expect(200)).body as MaterialDto;
      expect(updated.sellPrice).toBe(590);

      await t.http().delete(`/materials/${created.id}`).set(bearer(owner)).expect(204);
      await t.http().get(`/materials/${created.id}`).set(bearer(owner)).expect(404);
    });

    it('validates in Arabic, including tracks needing مجرى or كرنيشة', async () => {
      const owner = await registerShop(t);
      const res = await t
        .http()
        .post('/materials')
        .set(bearer(owner))
        .send({ name: 'م', layer: 'track', sellPrice: -1 })
        .expect(400);
      expect(res.body.fieldErrors).toMatchObject({
        name: 'اكتب اسم الخامة',
        sellPrice: 'اكتب سعر البيع',
      });
      const track = await t.http().post('/materials').set(bearer(owner)).send({ name: 'مجرى', layer: 'track', sellPrice: 100 }).expect(400);
      expect(track.body.fieldErrors).toEqual({ look: 'اختار: مجرى ولا كرنيشة' });
    });

    it('keeps model items with their last name and price when the material is deleted', async () => {
      const owner = await registerShop(t);
      await t.http().post('/catalog/template').set(bearer(owner)).expect(200);
      const options = (await t.http().get('/materials/options').set(bearer(owner)).expect(200)).body as MaterialDto[];
      const ribbon = options.find((m) => m.name === 'شريط ويفي');
      await t.http().delete(`/materials/${ribbon?.id}`).set(bearer(owner)).expect(204);

      const models = (await t.http().get('/models').set(bearer(owner)).expect(200)).body as CurtainModelDto[];
      const item = models.find((model) => model.name === 'ويفي (موجة)')?.items.find((i) => i.label === 'شريط ويفي');
      expect(item).toMatchObject({ materialId: null, price: 25, unitPrice: 25 });
    });
  });

  describe('permissions and isolation', () => {
    it('hides purchase prices and catalog management from technicians', async () => {
      const owner = await registerShop(t);
      await t.http().post('/catalog/template').set(bearer(owner)).expect(200);
      const tech = await addTechnician(t, owner);

      const options = (await t.http().get('/materials/options').set(bearer(tech)).expect(200)).body as Record<string, unknown>[];
      expect(options.length).toBe(31);
      for (const material of options) {
        expect(material).not.toHaveProperty('purchasePrice');
        expect(material).not.toHaveProperty('supplierName');
      }
      await t.http().get('/models').set(bearer(tech)).expect(200);

      await t.http().get('/materials').set(bearer(tech)).expect(403);
      await t.http().get('/suppliers').set(bearer(tech)).expect(403);
      await t.http().post('/materials').set(bearer(tech)).send(velvet).expect(403);
      await t.http().post('/catalog/template').set(bearer(tech)).expect(403);
      await t.http().post('/materials/import').set(bearer(tech)).send({ rows: [] }).expect(403);
    });

    it('keeps each shop to its own catalog', async () => {
      const ownerA = await registerShop(t, 'محل أ');
      const ownerB = await registerShop(t, 'محل ب');
      const supplierA = (await t.http().post('/suppliers').set(bearer(ownerA)).send({ name: 'مورد أ' }).expect(201)).body as SupplierDto;
      const materialA = (await t.http().post('/materials').set(bearer(ownerA)).send(velvet).expect(201)).body as MaterialDto;

      // محل ب مايقدرش يقرا أو يعدّل أو يمسح حاجة من محل أ، ولا يربط خامته بمورد محل أ
      await t.http().get(`/materials/${materialA.id}`).set(bearer(ownerB)).expect(404);
      await t.http().patch(`/materials/${materialA.id}`).set(bearer(ownerB)).send(velvet).expect(404);
      await t.http().delete(`/materials/${materialA.id}`).set(bearer(ownerB)).expect(404);
      await t.http().patch(`/suppliers/${supplierA.id}`).set(bearer(ownerB)).send({ name: 'x x' }).expect(404);
      const stolen = await t.http().post('/materials').set(bearer(ownerB)).send({ ...velvet, supplierId: supplierA.id }).expect(400);
      expect(stolen.body.fieldErrors).toEqual({ supplierId: 'اختار مورد من القايمة' });

      const models = (await t.http().get('/models').set(bearer(ownerB)).expect(200)).body as CurtainModelDto[];
      const res = await t
        .http()
        .patch(`/models/${models[0].id}`)
        .set(bearer(ownerB))
        .send({
          name: 'موديل',
          pricingMethod: 'linear_fullness',
          fullness: 2,
          laborPerUnit: 50,
          items: [{ kind: 'accessory', materialId: materialA.id, quantity: 1 }],
        })
        .expect(400);
      expect(res.body.fieldErrors).toEqual({ 'items.0.materialId': 'اختار خامة من الكتالوج' });

      const listB = (await t.http().get('/materials/options').set(bearer(ownerB)).expect(200)).body as MaterialDto[];
      expect(listB).toEqual([]);
    });
  });

  describe('suppliers', () => {
    it('creates, counts materials, rejects duplicate names and deletes without losing materials', async () => {
      const owner = await registerShop(t);
      const supplier = (await t
        .http()
        .post('/suppliers')
        .set(bearer(owner))
        .send({ name: 'الأناضول للأقمشة', whatsapp: '0100 123 4567', paymentMethod: 'credit', creditDays: 30, leadTimeMinDays: 3, leadTimeMaxDays: 5 })
        .expect(201)).body as SupplierDto;
      expect(supplier).toMatchObject({ whatsapp: '01001234567', creditDays: 30, materialsCount: 0 });

      const dup = await t.http().post('/suppliers').set(bearer(owner)).send({ name: 'الاناضول للاقمشه' }).expect(409);
      expect(dup.body.fieldErrors).toEqual({ name: 'فيه مورد بنفس الاسم' });

      const material = (await t.http().post('/materials').set(bearer(owner)).send({ ...velvet, supplierId: supplier.id }).expect(201))
        .body as MaterialDto;
      const list = (await t.http().get('/suppliers').set(bearer(owner)).expect(200)).body as SupplierDto[];
      expect(list[0].materialsCount).toBe(1);

      await t.http().delete(`/suppliers/${supplier.id}`).set(bearer(owner)).expect(204);
      const after = (await t.http().get(`/materials/${material.id}`).set(bearer(owner)).expect(200)).body as MaterialDto;
      expect(after.supplierId).toBeNull();
    });

    it('drops credit days for cash suppliers and checks lead time order', async () => {
      const owner = await registerShop(t);
      const cash = (await t.http().post('/suppliers').set(bearer(owner)).send({ name: 'مورد كاش', paymentMethod: 'cash', creditDays: 30 }).expect(201))
        .body as SupplierDto;
      expect(cash.creditDays).toBeNull();
      const bad = await t.http().post('/suppliers').set(bearer(owner)).send({ name: 'مورد', leadTimeMinDays: 5, leadTimeMaxDays: 2 }).expect(400);
      expect(bad.body.fieldErrors).toEqual({ leadTimeMaxDays: 'أقصى مدة لازم تبقى أكبر من أقل مدة' });
    });
  });

  describe('excel import', () => {
    it('creates suppliers by name, updates by code or name, and inserts new rows', async () => {
      const owner = await registerShop(t);
      await t.http().post('/catalog/template').set(bearer(owner)).expect(200);

      const res = await t
        .http()
        .post('/materials/import')
        .set(bearer(owner))
        .send({
          rows: [
            // موجودة: تتحدث بالاسم (حتى بهمزة مختلفة)
            { name: 'قطيفه تركي', layer: 'main', look: 'قطيفة', supplierName: 'الأناضول للأقمشة', purchasePrice: 430, sellPrice: 580 },
            // جديدة بمورد جديد
            { name: 'تل فرنساوي', layer: 'sheer', tier: 'premium', supplierName: 'باريس للأقمشة', supplierCode: 'FR-1', sellPrice: 650 },
          ],
        })
        .expect(200);
      expect(res.body as MaterialImportResult).toEqual({ created: 1, updated: 1, suppliersCreated: 1 });

      const velvetRow = ((await t.http().get(`/materials?q=${encodeURIComponent('قطيفة تركي')}`).set(bearer(owner)).expect(200)).body as MaterialListDto)
        .items[0];
      expect(velvetRow).toMatchObject({ sellPrice: 580, purchasePrice: 430 });

      // نفس الكود والمورد = تحديث حتى لو الاسم اتغير
      const again = await t
        .http()
        .post('/materials/import')
        .set(bearer(owner))
        .send({ rows: [{ name: 'تل فرنساوي مطرز', layer: 'sheer', supplierName: 'باريس للأقمشة', supplierCode: 'FR-1', sellPrice: 700 }] })
        .expect(200);
      expect(again.body).toEqual({ created: 0, updated: 1, suppliersCreated: 0 });
      expect((await counts(owner)).materials).toBe(32);
    });

    it('rejects invalid rows with the row index', async () => {
      const owner = await registerShop(t);
      const res = await t
        .http()
        .post('/materials/import')
        .set(bearer(owner))
        .send({ rows: [{ name: 'شيفون', layer: 'sheer', sellPrice: 100 }, { name: 'x', layer: 'sheer', sellPrice: 'غالي' }] })
        .expect(400);
      expect(Object.keys(res.body.fieldErrors)).toEqual(['rows.1.name', 'rows.1.sellPrice']);
    });
  });

  describe('models', () => {
    it('saves a model with catalog and fixed-price items and completes the models step', async () => {
      const owner = await registerShop(t);
      await t.http().post('/catalog/template').set(bearer(owner)).expect(200);
      const options = (await t.http().get('/materials/options').set(bearer(owner)).expect(200)).body as MaterialDto[];
      const remote = options.find((m) => m.name === 'ريموت 5 قنوات');

      const created = (await t
        .http()
        .post('/models')
        .set(bearer(owner))
        .send({
          name: 'كسرات بريموت',
          pricingMethod: 'linear_fullness',
          fullness: 2.5,
          laborPerUnit: 90,
          operation: 'motorized',
          items: [
            { kind: 'operation', materialId: remote?.id, quantity: 1 },
            { kind: 'operation', label: 'تركيب وبرمجة', unitPrice: 300, quantity: 1 },
          ],
        })
        .expect(201)).body as CurtainModelDto;
      expect(created.items.map((item) => [item.label, item.price, item.isRequired])).toEqual([
        ['ريموت 5 قنوات', 450, true],
        ['تركيب وبرمجة', 300, true],
      ]);

      const updated = (await t
        .http()
        .patch(`/models/${created.id}`)
        .set(bearer(owner))
        .send({ name: 'كسرات بريموت', pricingMethod: 'square_meter', fullness: 2.5, laborPerUnit: 90, operation: 'motorized', items: [] })
        .expect(200)).body as CurtainModelDto;
      // المتر المربع مالوش كشكشة
      expect(updated).toMatchObject({ pricingMethod: 'square_meter', fullness: 1, items: [] });

      const me = (await t.http().get('/me').set(bearer(owner)).expect(200)).body;
      expect(me.shop.completedSteps).toContain('models');

      await t.http().delete(`/models/${created.id}`).set(bearer(owner)).expect(204);
      await t.http().get(`/models/${created.id}`).set(bearer(owner)).expect(404);
    });

    it('requires a label and price for items not linked to the catalog', async () => {
      const owner = await registerShop(t);
      const res = await t
        .http()
        .post('/models')
        .set(bearer(owner))
        .send({ name: 'موديل', pricingMethod: 'piece', laborPerUnit: 0, items: [{ kind: 'accessory', quantity: 1 }] })
        .expect(400);
      expect(res.body.fieldErrors).toEqual({ 'items.0.label': 'اختار خامة من الكتالوج أو اكتب اسم البند وسعره' });
    });

    it('adds the default models only when the shop has none', async () => {
      const owner = await registerShop(t);
      const models = (await t.http().post('/models/defaults').set(bearer(owner)).expect(200)).body as CurtainModelDto[];
      expect(models).toHaveLength(8);
    });
  });
});
