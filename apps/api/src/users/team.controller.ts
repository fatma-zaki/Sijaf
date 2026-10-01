import { Controller, Get, Inject } from '@nestjs/common';
import type { AccessTokenClaims, TeamMemberDto } from '@sijaf/shared';
import { and, asc, eq } from 'drizzle-orm';
import { CurrentUser } from '../common/auth.decorators.js';
import { DB, type Db } from '../db/db.module.js';
import { users } from '../db/schema.js';

/** أسماء الفريق النشط لكل المستخدمين (فلتر الفنيين في المواعيد) */
@Controller('team')
export class TeamController {
  constructor(@Inject(DB) private readonly db: Db) {}

  @Get()
  async list(@CurrentUser() auth: AccessTokenClaims): Promise<TeamMemberDto[]> {
    const rows = await this.db
      .select({ id: users.id, fullName: users.fullName, jobTitle: users.jobTitle, role: users.role })
      .from(users)
      .where(and(eq(users.shopId, auth.shopId), eq(users.isActive, true)))
      .orderBy(asc(users.createdAt));
    return rows.map(({ role, ...member }) => ({ ...member, isOwner: role === 'owner' }));
  }
}
