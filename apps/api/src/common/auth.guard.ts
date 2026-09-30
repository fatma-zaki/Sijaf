import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { userRoles, type AccessTokenClaims, type UserRole } from '@sijaf/shared';
import { IS_PUBLIC, ROLES, type AuthedRequest } from './auth.decorators.js';

function isClaims(value: unknown): value is AccessTokenClaims {
  if (typeof value !== 'object' || value === null) return false;
  const claims = value as Record<string, unknown>;
  return (
    typeof claims.sub === 'string' &&
    typeof claims.shopId === 'string' &&
    typeof claims.canQuote === 'boolean' &&
    userRoles.includes(claims.role as UserRole)
  );
}

/** Guard عام: كل endpoint محتاج توكن إلا اللي عليه @Public، وبعدها بيشيك على @Roles */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('سجّل دخولك الأول');

    let payload: unknown;
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('انتهت الجلسة، سجّل دخولك تاني');
    }
    if (!isClaims(payload)) throw new UnauthorizedException('انتهت الجلسة، سجّل دخولك تاني');
    request.auth = { sub: payload.sub, shopId: payload.shopId, role: payload.role, canQuote: payload.canQuote };

    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES, targets);
    if (roles && !roles.includes(payload.role)) {
      throw new ForbiddenException('الصفحة دي لصاحب المحل بس');
    }
    return true;
  }
}
