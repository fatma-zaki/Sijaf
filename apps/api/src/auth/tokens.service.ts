import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AccessTokenClaims, AuthTokens } from '@sijaf/shared';
import { and, eq, isNull } from 'drizzle-orm';
import { ENV, type Env } from '../config/env.js';
import { DB, type Db } from '../db/db.module.js';
import { refreshTokens, users, type UserRow } from '../db/schema.js';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const SESSION_EXPIRED = 'انتهت الجلسة، سجّل دخولك تاني';

/**
 * Access token قصير (JWT) + refresh token عشوائي بيتغيّر مع كل استخدام.
 * لو refresh token قديم اتستخدم تاني يبقى اتسرق، فبنلغي الـ family كلها.
 */
@Injectable()
export class TokensService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(ENV) private readonly env: Env,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}

  async issue(user: UserRow, familyId: string = randomUUID()): Promise<AuthTokens> {
    const claims: AccessTokenClaims = {
      sub: user.id,
      shopId: user.shopId,
      role: user.role,
      canQuote: user.role === 'owner' || user.canQuote,
    };
    const accessToken = await this.jwt.signAsync(claims, { expiresIn: this.env.ACCESS_TOKEN_TTL_SECONDS });
    const refreshToken = randomBytes(32).toString('base64url');
    await this.db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt: new Date(Date.now() + this.env.REFRESH_TOKEN_TTL_SECONDS * 1000),
    });
    return {
      accessToken,
      accessTokenExpiresIn: this.env.ACCESS_TOKEN_TTL_SECONDS,
      refreshToken,
      refreshTokenExpiresIn: this.env.REFRESH_TOKEN_TTL_SECONDS,
    };
  }

  async rotate(refreshToken: string): Promise<AuthTokens> {
    const [row] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, hashToken(refreshToken)))
      .limit(1);
    if (!row) throw new UnauthorizedException(SESSION_EXPIRED);

    if (row.revokedAt) {
      await this.revokeFamily(row.familyId);
      throw new UnauthorizedException(SESSION_EXPIRED);
    }
    if (row.expiresAt.getTime() <= Date.now()) throw new UnauthorizedException(SESSION_EXPIRED);

    // لو طلبين refresh وصلوا مع بعض، واحد بس يكسب
    const revoked = await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.id, row.id), isNull(refreshTokens.revokedAt)))
      .returning({ id: refreshTokens.id });
    if (revoked.length === 0) throw new UnauthorizedException(SESSION_EXPIRED);

    const [user] = await this.db.select().from(users).where(eq(users.id, row.userId)).limit(1);
    if (!user?.isActive) {
      await this.revokeFamily(row.familyId);
      throw new UnauthorizedException('الحساب ده متوقف، كلّم صاحب المحل');
    }
    return this.issue(user, row.familyId);
  }

  async revoke(refreshToken: string): Promise<void> {
    const [row] = await this.db
      .select({ familyId: refreshTokens.familyId })
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, hashToken(refreshToken)))
      .limit(1);
    if (row) await this.revokeFamily(row.familyId);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.familyId, familyId), isNull(refreshTokens.revokedAt)));
  }
}
