import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { AccessTokenClaims, UserRole } from '@sijaf/shared';
import type { Request } from 'express';

export const IS_PUBLIC = 'isPublic';
export const ROLES = 'roles';

/** endpoint من غير تسجيل دخول */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** endpoint لأدوار معيّنة بس */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES, roles);

export type AuthedRequest = Request & { auth: AccessTokenClaims };

/** بيانات المستخدم من التوكن: sub وshopId وrole */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessTokenClaims =>
    context.switchToHttp().getRequest<AuthedRequest>().auth,
);
