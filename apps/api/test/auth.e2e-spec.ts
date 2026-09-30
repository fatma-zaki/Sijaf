import type { AuthTokens, MeDto, UserDto } from '@sijaf/shared';
import { createTestApp, nextPhone, type TestApp } from './test-app.js';

const PASSWORD = 'secret-pass-1';

describe('auth, shop and team (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.close();
  });

  async function registerShop(shopName = 'ستائر الأمل') {
    const phone = nextPhone();
    const res = await t
      .http()
      .post('/auth/register')
      .send({ shopName, ownerName: 'محمد', phone, password: PASSWORD })
      .expect(201);
    return { phone, tokens: res.body as AuthTokens };
  }

  const bearer = (tokens: AuthTokens) => ({ Authorization: `Bearer ${tokens.accessToken}` });

  it('reports health', async () => {
    await t.http().get('/health').expect(200, { status: 'ok' });
  });

  it('registers a shop with its owner', async () => {
    const { phone, tokens } = await registerShop();
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();

    const me = (await t.http().get('/me').set(bearer(tokens)).expect(200)).body as MeDto;
    expect(me.user).toMatchObject({ fullName: 'محمد', phone, role: 'owner', canQuote: true });
    expect(me.user).not.toHaveProperty('passwordHash');
    expect(me.shop).toMatchObject({ name: 'ستائر الأمل', whatsapp: phone, completedSteps: [] });
  });

  it('normalizes the phone and rejects duplicates with a field error', async () => {
    const { phone } = await registerShop();
    const spaced = `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
    const res = await t
      .http()
      .post('/auth/register')
      .send({ shopName: 'محل تاني', ownerName: 'علي', phone: spaced, password: PASSWORD })
      .expect(409);
    expect(res.body.fieldErrors).toEqual({ phone: 'الرقم ده متسجل قبل كده' });
  });

  it('returns Arabic field errors for invalid input', async () => {
    const res = await t
      .http()
      .post('/auth/register')
      .send({ shopName: '', ownerName: 'علي', phone: '123', password: 'short' })
      .expect(400);
    expect(res.body.fieldErrors).toMatchObject({
      shopName: 'اكتب اسم المحل',
      phone: 'رقم الموبايل لازم يبقى 11 رقم ويبدأ بـ 01',
      password: 'كلمة السر لازم تبقى 8 حروف على الأقل',
    });
  });

  it('logs in with the right password only', async () => {
    const { phone } = await registerShop();
    await t.http().post('/auth/login').send({ phone, password: 'wrong-password' }).expect(401);
    await t.http().post('/auth/login').send({ phone: nextPhone(), password: PASSWORD }).expect(401);
    const res = await t.http().post('/auth/login').send({ phone, password: PASSWORD }).expect(200);
    expect((res.body as AuthTokens).accessToken).toBeTruthy();
  });

  it('requires a valid access token', async () => {
    await t.http().get('/me').expect(401);
    await t.http().get('/me').set({ Authorization: 'Bearer not-a-jwt' }).expect(401);
  });

  it('rotates refresh tokens and revokes the family on reuse', async () => {
    const { tokens } = await registerShop();
    const first = (await t.http().post('/auth/refresh').send({ refreshToken: tokens.refreshToken }).expect(200))
      .body as AuthTokens;
    expect(first.refreshToken).not.toBe(tokens.refreshToken);

    // التوكن القديم اتستخدم تاني: كده الـ family كلها تتلغي
    await t.http().post('/auth/refresh').send({ refreshToken: tokens.refreshToken }).expect(401);
    await t.http().post('/auth/refresh').send({ refreshToken: first.refreshToken }).expect(401);
  });

  it('logs out by revoking the refresh token', async () => {
    const { tokens } = await registerShop();
    await t.http().post('/auth/logout').send({ refreshToken: tokens.refreshToken }).expect(204);
    await t.http().post('/auth/refresh').send({ refreshToken: tokens.refreshToken }).expect(401);
  });

  it('updates the shop profile and completes onboarding steps idempotently', async () => {
    const { tokens } = await registerShop();
    const whatsapp = nextPhone();
    const shop = (
      await t
        .http()
        .patch('/shop')
        .set(bearer(tokens))
        .send({ name: 'ستائر النور', whatsapp, address: 'مدينة نصر' })
        .expect(200)
    ).body as MeDto['shop'];
    expect(shop).toMatchObject({ name: 'ستائر النور', whatsapp, address: 'مدينة نصر', completedSteps: ['shop'] });

    await t.http().post('/shop/onboarding/steps/team').set(bearer(tokens)).expect(200);
    const again = await t.http().post('/shop/onboarding/steps/team').set(bearer(tokens)).expect(200);
    expect(again.body.completedSteps).toEqual(['shop', 'team']);

    await t.http().post('/shop/onboarding/steps/unknown').set(bearer(tokens)).expect(400);
  });

  describe('team', () => {
    it('lets the owner add technicians who cannot manage the shop', async () => {
      const { tokens: owner } = await registerShop();
      const techPhone = nextPhone();
      const created = (
        await t
          .http()
          .post('/users')
          .set(bearer(owner))
          .send({ fullName: 'عمرو', phone: techPhone, password: PASSWORD, jobTitle: 'فني معاينة', canQuote: true })
          .expect(201)
      ).body as UserDto;
      expect(created).toMatchObject({ role: 'technician', canQuote: true, isActive: true });

      const list = (await t.http().get('/users').set(bearer(owner)).expect(200)).body as UserDto[];
      expect(list.map((user) => user.role)).toEqual(['owner', 'technician']);

      const tech = (await t.http().post('/auth/login').send({ phone: techPhone, password: PASSWORD }).expect(200))
        .body as AuthTokens;
      const me = (await t.http().get('/me').set(bearer(tech)).expect(200)).body as MeDto;
      expect(me.user.role).toBe('technician');

      await t.http().get('/users').set(bearer(tech)).expect(403);
      await t.http().patch('/shop').set(bearer(tech)).send({ name: 'x', whatsapp: techPhone }).expect(403);
      await t.http().post('/shop/onboarding/steps/team').set(bearer(tech)).expect(403);
    });

    it('blocks deactivated technicians and their sessions', async () => {
      const { tokens: owner } = await registerShop();
      const techPhone = nextPhone();
      const tech = (
        await t
          .http()
          .post('/users')
          .set(bearer(owner))
          .send({ fullName: 'خالد', phone: techPhone, password: PASSWORD })
          .expect(201)
      ).body as UserDto;
      const session = (await t.http().post('/auth/login').send({ phone: techPhone, password: PASSWORD }).expect(200))
        .body as AuthTokens;

      await t.http().patch(`/users/${tech.id}`).set(bearer(owner)).send({ isActive: false }).expect(200);
      await t.http().post('/auth/login').send({ phone: techPhone, password: PASSWORD }).expect(403);
      await t.http().post('/auth/refresh').send({ refreshToken: session.refreshToken }).expect(401);
    });

    it('isolates shops from each other', async () => {
      const { tokens: ownerA } = await registerShop('محل أ');
      const { tokens: ownerB } = await registerShop('محل ب');
      const techA = (
        await t
          .http()
          .post('/users')
          .set(bearer(ownerA))
          .send({ fullName: 'حسن', phone: nextPhone(), password: PASSWORD })
          .expect(201)
      ).body as UserDto;

      await t.http().patch(`/users/${techA.id}`).set(bearer(ownerB)).send({ isActive: false }).expect(404);
      const listB = (await t.http().get('/users').set(bearer(ownerB)).expect(200)).body as UserDto[];
      expect(listB.map((user) => user.id)).not.toContain(techA.id);
    });

    it('does not let the owner be edited through the team endpoint', async () => {
      const { tokens: owner } = await registerShop();
      const me = (await t.http().get('/me').set(bearer(owner)).expect(200)).body as MeDto;
      await t.http().patch(`/users/${me.user.id}`).set(bearer(owner)).send({ isActive: false }).expect(400);
    });
  });
});
