import { randomBytes } from 'node:crypto';
import { ConflictException, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthTokens, LoginData, RegisterData } from '@sijaf/shared';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module.js';
import { shops, users } from '../db/schema.js';
import { TokensService } from './tokens.service.js';

const BCRYPT_ROUNDS = 12;
// عشان وقت الرد يبقى واحد سواء الرقم متسجل ولا لأ
const DUMMY_HASH = bcrypt.hashSync('sijaf-timing-guard', BCRYPT_ROUNDS);

export const PHONE_TAKEN = 'الرقم ده متسجل قبل كده';

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** slug مؤقت لحد ما صاحب المحل يختار رابط محله */
function temporarySlug(): string {
  return `shop-${randomBytes(4).toString('hex')}`;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(TokensService) private readonly tokens: TokensService,
  ) {}

  async register(data: RegisterData): Promise<AuthTokens> {
    await this.assertPhoneAvailable(data.phone);
    const passwordHash = await hashPassword(data.password);

    const owner = await this.db.transaction(async (tx) => {
      const [shop] = await tx
        .insert(shops)
        .values({ name: data.shopName, slug: temporarySlug(), whatsapp: data.phone })
        .returning();
      const [user] = await tx
        .insert(users)
        .values({
          shopId: shop.id,
          fullName: data.ownerName,
          phone: data.phone,
          passwordHash,
          role: 'owner',
          jobTitle: 'صاحب المحل',
          canQuote: true,
        })
        .returning();
      return user;
    });

    return this.tokens.issue(owner);
  }

  async login(data: LoginData): Promise<AuthTokens> {
    const [user] = await this.db.select().from(users).where(eq(users.phone, data.phone)).limit(1);
    const valid = await bcrypt.compare(data.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) throw new UnauthorizedException('رقم الموبايل أو كلمة السر غلط');
    if (!user.isActive) throw new ForbiddenException('الحساب ده متوقف، كلّم صاحب المحل');

    await this.db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    return this.tokens.issue(user);
  }

  refresh(refreshToken: string): Promise<AuthTokens> {
    return this.tokens.rotate(refreshToken);
  }

  logout(refreshToken: string): Promise<void> {
    return this.tokens.revoke(refreshToken);
  }

  async assertPhoneAvailable(phone: string): Promise<void> {
    const [existing] = await this.db.select({ id: users.id }).from(users).where(eq(users.phone, phone)).limit(1);
    if (existing) {
      throw new ConflictException({ statusCode: 409, message: PHONE_TAKEN, fieldErrors: { phone: PHONE_TAKEN } });
    }
  }
}
