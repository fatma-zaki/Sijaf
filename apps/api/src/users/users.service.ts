import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateTechnicianData, UpdateTechnicianInput, UserDto } from '@sijaf/shared';
import { and, asc, eq } from 'drizzle-orm';
import { AuthService, hashPassword } from '../auth/auth.service.js';
import { TokensService } from '../auth/tokens.service.js';
import { toUserDto } from '../common/dto.js';
import { DB, type Db } from '../db/db.module.js';
import { users } from '../db/schema.js';

/** فريق المحل: كل العمليات متقيدة بـ shopId من توكن صاحب المحل */
@Injectable()
export class UsersService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(TokensService) private readonly tokens: TokensService,
  ) {}

  async list(shopId: string): Promise<UserDto[]> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.shopId, shopId))
      .orderBy(asc(users.role), asc(users.createdAt));
    return rows.map(toUserDto);
  }

  async createTechnician(shopId: string, data: CreateTechnicianData): Promise<UserDto> {
    await this.auth.assertPhoneAvailable(data.phone);
    const [user] = await this.db
      .insert(users)
      .values({
        shopId,
        fullName: data.fullName,
        phone: data.phone,
        passwordHash: await hashPassword(data.password),
        role: 'technician',
        jobTitle: data.jobTitle,
        canQuote: data.canQuote,
      })
      .returning();
    return toUserDto(user);
  }

  async updateTechnician(shopId: string, userId: string, data: UpdateTechnicianInput): Promise<UserDto> {
    const [target] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.shopId, shopId)))
      .limit(1);
    if (!target) throw new NotFoundException('المستخدم مش موجود');
    if (target.role === 'owner') throw new BadRequestException('مينفعش تعدّل صلاحيات صاحب المحل من هنا');

    const [updated] = await this.db.update(users).set(data).where(eq(users.id, userId)).returning();
    // لو اتوقف أو صلاحياته اتغيرت، يسجّل دخول من جديد عشان التوكن يتحدث
    if (data.isActive === false || data.canQuote !== undefined) await this.tokens.revokeAllForUser(userId);
    return toUserDto(updated);
  }
}
