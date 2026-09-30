import { timingSafeEqual } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { ENV, type Env } from '../config/env.js';

export const CLIENT_IP_HEADER = 'x-sijaf-client-ip';
export const INTERNAL_KEY_HEADER = 'x-sijaf-internal-key';

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * الطلبات جاية من سيرفر Next مش من المتصفح، فالـ IP بتاعها واحد لكل المستخدمين.
 * Next بيبعت IP العميل الحقيقي ومعاه مفتاح سري؛ لو المفتاح صح بنحسب الـ rate limit على IP العميل.
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  @Inject(ENV) private readonly env!: Env;

  protected override getTracker(request: Request): Promise<string> {
    const secret = this.env.INTERNAL_API_SECRET;
    const key = request.headers[INTERNAL_KEY_HEADER];
    const clientIp = request.headers[CLIENT_IP_HEADER];
    if (secret && typeof key === 'string' && typeof clientIp === 'string' && clientIp && safeEqual(key, secret)) {
      return Promise.resolve(clientIp);
    }
    return Promise.resolve(request.ip ?? 'unknown');
  }
}
