import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  loginSchema,
  refreshSchema,
  registerSchema,
  type AuthTokens,
  type LoginData,
  type RegisterData,
} from '@sijaf/shared';
import type { z } from 'zod';
import { Public } from '../common/auth.decorators.js';
import { ZodPipe } from '../common/zod-body.js';
import { AuthService } from './auth.service.js';

type RefreshBody = z.output<typeof refreshSchema>;

@Public()
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  register(@Body(new ZodPipe(registerSchema)) body: RegisterData): Promise<AuthTokens> {
    return this.auth.register(body);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  login(@Body(new ZodPipe(loginSchema)) body: LoginData): Promise<AuthTokens> {
    return this.auth.login(body);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body(new ZodPipe(refreshSchema)) body: RefreshBody): Promise<AuthTokens> {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body(new ZodPipe(refreshSchema)) body: RefreshBody): Promise<void> {
    await this.auth.logout(body.refreshToken);
  }
}
