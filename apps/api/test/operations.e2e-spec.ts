import {
  addDays,
  cairoDate,
  weekStart,
  type AppointmentDto,
  type ClientDto,
  type ClientListDto,
  type DashboardDto,
  type QuoteEventDto,
  type ReportsDto,
} from '@sijaf/shared';
import { eq, sql } from 'drizzle-orm';
import { clients, quoteItems, quotes } from '../src/db/schema.js';
import { me, pricedQuote, shopWithCatalog } from './quote-helpers.js';
import { addTechnician, bearer, createTestApp, nextPhone, registerShop, type TestApp } from './test-app.js';

const DAY_MS = 86_400_000;

describe('clients, schedule and reports (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.close();
  });

  const shop = () => shopWithCatalog(t, registerShop);
  const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS);

  describe('clients', () => {
    const list = async (tokens: Parameters<typeof bearer>[0], query = '') =>
      (await t.http().get(`/clients${query}`).set(bearer(tokens)).expect(200)).body as ClientListDto;

    it('lists clients with quote counts, accepted value, tags and stats', async () => {
      const owner = await shop();
      const repeatPhone = nextPhone();
      const first = await pricedQuote(t, owner, { name: 'هالة سمير', phone: repeatPhone });
      await pricedQuote(t, owner, { name: 'هالة سمير', phone: repeatPhone });
      await t.http().patch(`/quotes/${first.id}`).set(bearer(owner)).send({ status: 'accepted' }).expect(200);

      // عرض اتبعت من 5 أيام ومحدش رد = محتاج متابعة
      const waiting = await pricedQuote(t, owner, { name: 'نادين فؤاد' });
      await t.http().post(`/quotes/${waiting.id}/sent`).set(bearer(owner)).expect(200);
      await t.db.update(quotes).set({ createdAt: daysAgo(5) }).where(eq(quotes.id, waiting.id));

      // عميل قديم من غير عروض
      const old = (await t.http().post('/clients').set(bearer(owner)).send({ name: 'كريم عادل', phone: nextPhone(), area: 'الدقي' }).expect(201))
        .body as ClientDto;
      await t.db.update(clients).set({ createdAt: daysAgo(90) }).where(eq(clients.id, old.id));

      const all = await list(owner);
      const byName = Object.fromEntries(all.items.map((c) => [c.name, c]));
      expect(byName['هالة سمير']).toMatchObject({ quoteCount: 2, acceptedTotal: first.total, tag: 'repeat', phone: repeatPhone });
      expect(byName['نادين فؤاد']).toMatchObject({ quoteCount: 1, acceptedTotal: 0, tag: 'followup' });
      expect(byName['كريم عادل']).toMatchObject({ quoteCount: 0, lastQuoteAt: null, tag: null, area: 'الدقي' });
      expect(all.items.at(-1)?.name).toBe('كريم عادل');
      expect(all.stats).toMatchObject({ total: 3, repeatPercent: 33 });
      expect(all.stats.newThisMonth).toBeGreaterThanOrEqual(2);

      expect((await list(owner, '?segment=repeat')).items.map((c) => c.name)).toEqual(['هالة سمير']);
      expect((await list(owner, '?segment=followup')).items.map((c) => c.name)).toEqual(['نادين فؤاد']);
      expect((await list(owner, '?segment=new')).items.map((c) => c.name)).not.toContain('كريم عادل');
      expect((await list(owner, `?q=${encodeURIComponent('هاله')}`)).total).toBe(0);
      expect((await list(owner, `?q=${encodeURIComponent('هالة')}`)).items.map((c) => c.name)).toEqual(['هالة سمير']);
      expect((await list(owner, `?q=${repeatPhone}`)).items.map((c) => c.name)).toEqual(['هالة سمير']);
      expect((await list(owner, '?pageSize=1&page=3')).items).toHaveLength(1);
    });

    it('adds clients once per phone, and lets the whole team read them', async () => {
      const owner = await shop();
      const phone = nextPhone();
      await t.http().post('/clients').set(bearer(owner)).send({ name: 'سارة علي', phone }).expect(201);
      const dup = await t.http().post('/clients').set(bearer(owner)).send({ name: 'سارة', phone }).expect(409);
      expect(dup.body.fieldErrors).toEqual({ phone: 'الرقم ده متسجل لعميل تاني' });
      await t.http().post('/clients').set(bearer(owner)).send({ name: 'س', phone: '123' }).expect(400);

      const installer = await addTechnician(t, owner, false);
      expect((await list(installer)).total).toBe(1);
      await t.http().post('/clients').set(bearer(installer)).send({ name: 'منى حسن', phone: nextPhone() }).expect(403);

      expect((await list(await registerShop(t))).total).toBe(0);
    });
  });

  describe('schedule', () => {
    const today = () => cairoDate(new Date());
    const appointment = (overrides: Record<string, unknown> = {}) => ({
      type: 'inspection',
      date: today(),
      time: '10:30',
      clientName: 'هالة سمير',
      clientPhone: nextPhone(),
      address: 'مدينة نصر · شارع مكرم عبيد',
      ...overrides,
    });
    const week = async (tokens: Parameters<typeof bearer>[0], extra = '') => {
      const from = weekStart(today());
      return (await t.http().get(`/appointments?from=${from}&to=${addDays(from, 6)}${extra}`).set(bearer(tokens)).expect(200)).body as AppointmentDto[];
    };

    it('creates appointments in Cairo time, linked to the client, technician and quote', async () => {
      const owner = await shop();
      const quote = await pricedQuote(t, owner);
      const technician = await addTechnician(t, owner, true);
      const technicianId = (await me(t, technician)).user.id;

      const created = (
        await t
          .http()
          .post('/appointments')
          .set(bearer(owner))
          .send(appointment({ type: 'installation', time: '13:00', technicianId, quoteId: quote.id, clientName: quote.client.name, clientPhone: quote.client.phone }))
          .expect(201)
      ).body as AppointmentDto;
      expect(created).toMatchObject({
        type: 'installation',
        date: today(),
        time: '13:00',
        title: 'أحمد محمد',
        clientId: quote.client.id,
        clientPhone: quote.client.phone,
        technician: { id: technicianId, name: 'عمرو' },
        quote: { id: quote.id, number: quote.number },
      });

      const log = (await t.http().get(`/quotes/${quote.id}/events`).set(bearer(owner)).expect(200)).body as QuoteEventDto[];
      expect(log[0]).toMatchObject({ type: 'appointment_scheduled', payload: { appointmentType: 'installation', startsAt: created.startsAt } });

      // تسليم القماش من غير موبايل
      await t.http().post('/appointments').set(bearer(owner)).send(appointment({ type: 'delivery', time: '09:30', clientName: 'الأناضول للأقمشة', clientPhone: '' })).expect(201);
      const noPhone = await t.http().post('/appointments').set(bearer(owner)).send(appointment({ clientPhone: '' })).expect(400);
      expect(noPhone.body.fieldErrors).toEqual({ clientPhone: 'اكتب موبايل العميل' });

      const items = await week(owner);
      expect(items.map((a) => a.time)).toEqual(['09:30', '13:00']);
      expect((await week(owner, `&technicianId=${technicianId}`)).map((a) => a.id)).toEqual([created.id]);
    });

    it('edits and deletes, and keeps installers read-only and shops apart', async () => {
      const owner = await shop();
      const created = (await t.http().post('/appointments').set(bearer(owner)).send(appointment()).expect(201)).body as AppointmentDto;
      const moved = (
        await t
          .http()
          .put(`/appointments/${created.id}`)
          .set(bearer(owner))
          .send(appointment({ date: addDays(today(), 1), time: '16:30', clientPhone: created.clientPhone }))
          .expect(200)
      ).body as AppointmentDto;
      expect(moved).toMatchObject({ date: addDays(today(), 1), time: '16:30', clientId: created.clientId });

      const installer = await addTechnician(t, owner, false);
      await t.http().get(`/appointments/${created.id}`).set(bearer(installer)).expect(200);
      // الفريق للكل، من غير موبايلات
      const team = await t.http().get('/team').set(bearer(installer)).expect(200);
      expect(team.body).toHaveLength(2);
      expect(team.body[0]).toMatchObject({ isOwner: true });
      expect(JSON.stringify(team.body)).not.toMatch(/01\d{9}/);
      await t.http().post('/appointments').set(bearer(installer)).send(appointment()).expect(403);
      await t.http().delete(`/appointments/${created.id}`).set(bearer(installer)).expect(403);

      const other = await shop();
      await t.http().get(`/appointments/${created.id}`).set(bearer(other)).expect(404);
      await t.http().put(`/appointments/${created.id}`).set(bearer(other)).send(appointment()).expect(404);
      await t.http().delete(`/appointments/${created.id}`).set(bearer(other)).expect(404);
      const otherTech = (await me(t, await addTechnician(t, other, true))).user.id;
      const foreign = await t.http().post('/appointments').set(bearer(owner)).send(appointment({ technicianId: otherTech })).expect(400);
      expect(foreign.body.fieldErrors).toEqual({ technicianId: 'اختار فني من القايمة' });
      const otherQuote = await pricedQuote(t, other);
      await t.http().post('/appointments').set(bearer(owner)).send(appointment({ quoteId: otherQuote.id })).expect(400);
      expect(await week(other)).toEqual([]);
      await t.http().get(`/appointments?from=2026-01-01&to=2026-06-01`).set(bearer(owner)).expect(400);

      await t.http().delete(`/appointments/${created.id}`).set(bearer(owner)).expect(204);
      await t.http().get(`/appointments/${created.id}`).set(bearer(owner)).expect(404);
    });
  });

  describe('reports and dashboard', () => {
    it('reports sent and accepted value, profit, accuracy, materials, tiers and suppliers for owners only', async () => {
      const owner = await shop();
      const accepted = await pricedQuote(t, owner);
      const sent = await pricedQuote(t, owner);
      await pricedQuote(t, owner); // قيد المراجعة
      await t.http().post(`/quotes/${sent.id}/sent`).set(bearer(owner)).expect(200);
      await t
        .http()
        .patch(`/quotes/${accepted.id}`)
        .set(bearer(owner))
        .send({ status: 'accepted', finalTotal: accepted.total * 1.1 })
        .expect(200);

      const report = (await t.http().get('/reports?period=month').set(bearer(owner)).expect(200)).body as ReportsDto;
      const [{ profit }] = await t.db
        .select({ profit: sql<string>`sum((${quoteItems.unitPrice} - ${quoteItems.unitCost}) * ${quoteItems.quantity})` })
        .from(quoteItems)
        .where(eq(quoteItems.quoteId, accepted.id));
      expect(report).toMatchObject({
        period: 'month',
        totalQuotes: 3,
        sent: { count: 2, value: accepted.total + sent.total },
        accepted: { count: 1, value: accepted.total, rate: 50 },
        accuracy: 10,
        tiers: { economy: 0, standard: 1, premium: 0 },
      });
      expect(report.expectedProfit).toBeCloseTo(Number(profit), 2);
      expect(report.expectedProfit).toBeGreaterThan(0);
      expect(report.monthly).toHaveLength(6);
      expect(report.monthly.at(-1)?.count).toBe(3);
      // البطانة مش من «الخامات الأكثر طلبًا»
      expect(report.topMaterials).toContainEqual({ name: 'قطيفة تركي', count: 3 });
      expect(report.topMaterials.map((m) => m.name)).not.toContain('بطانة عادية');
      expect(report.suppliers.length).toBeGreaterThan(0);
      expect(report.suppliers[0].quoteCount).toBe(3);

      const technician = await addTechnician(t, owner, true);
      await t.http().get('/reports').set(bearer(technician)).expect(403);
      await t.http().get('/reports?period=decade').set(bearer(owner)).expect(400);
      const newShop = await registerShop(t);
      const empty = (await t.http().get('/reports').set(bearer(newShop)).expect(200)).body as ReportsDto;
      expect(empty).toMatchObject({ totalQuotes: 0, accuracy: null, accepted: { rate: null }, suppliers: [] });
    });

    it('shows quote numbers to quoters and own appointments to technicians', async () => {
      const owner = await shop();
      const quote = await pricedQuote(t, owner);
      await t.http().patch(`/quotes/${quote.id}`).set(bearer(owner)).send({ status: 'accepted' }).expect(200);
      const installer = await addTechnician(t, owner, false);
      const installerId = (await me(t, installer)).user.id;
      const date = cairoDate(new Date());
      const base = { type: 'installation', date, clientName: 'أحمد محمد', clientPhone: quote.client.phone };
      await t.http().post('/appointments').set(bearer(owner)).send({ ...base, time: '23:58', technicianId: installerId }).expect(201);
      await t.http().post('/appointments').set(bearer(owner)).send({ ...base, time: '23:59' }).expect(201);

      const mine = (await t.http().get('/dashboard').set(bearer(owner)).expect(200)).body as DashboardDto;
      expect(mine.quotes).toMatchObject({ month: 1, today: 1, acceptedMonth: 1 });
      expect(mine.quotes?.recent[0]).toMatchObject({ id: quote.id, widthCm: 300, heightCm: 260 });
      expect(mine.todayAppointments).toHaveLength(2);

      const theirs = (await t.http().get('/dashboard').set(bearer(installer)).expect(200)).body as DashboardDto;
      expect(theirs.quotes).toBeNull();
      expect(theirs.todayAppointments.map((a) => a.time)).toEqual(['23:58']);
    });
  });
});
