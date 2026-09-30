import type { Request } from 'express';
import { CLIENT_IP_HEADER, ClientIpThrottlerGuard, INTERNAL_KEY_HEADER } from './client-ip-throttler.guard.js';

const SECRET = 'internal-secret-that-is-at-least-32-chars';

type Tracker = (request: Request) => Promise<string>;

function tracker(secret: string | undefined): Tracker {
  const getTracker = (ClientIpThrottlerGuard.prototype as unknown as { getTracker: Tracker }).getTracker;
  return (request) => getTracker.call({ env: { INTERNAL_API_SECRET: secret } }, request);
}

const request = (headers: Record<string, string>, ip = '10.0.0.1') => ({ headers, ip }) as unknown as Request;

describe('ClientIpThrottlerGuard', () => {
  it('uses the forwarded client IP when the internal key matches', async () => {
    const req = request({ [CLIENT_IP_HEADER]: '41.33.1.2', [INTERNAL_KEY_HEADER]: SECRET });
    await expect(tracker(SECRET)(req)).resolves.toBe('41.33.1.2');
  });

  it('ignores the forwarded IP with a wrong or missing key', async () => {
    await expect(tracker(SECRET)(request({ [CLIENT_IP_HEADER]: '41.33.1.2', [INTERNAL_KEY_HEADER]: 'nope' }))).resolves.toBe('10.0.0.1');
    await expect(tracker(SECRET)(request({ [CLIENT_IP_HEADER]: '41.33.1.2' }))).resolves.toBe('10.0.0.1');
  });

  it('never trusts the header when no secret is configured', async () => {
    const req = request({ [CLIENT_IP_HEADER]: '41.33.1.2', [INTERNAL_KEY_HEADER]: '' });
    await expect(tracker(undefined)(req)).resolves.toBe('10.0.0.1');
  });
});
