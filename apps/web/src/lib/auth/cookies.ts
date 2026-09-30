import type { AuthTokens } from "@sijaf/shared";

/** أسماء الكوكيز وإعداداتها؛ بتتستخدم من proxy.ts ومن الـ Server Actions */
export const ACCESS_COOKIE = "sijaf_at";
export const REFRESH_COOKIE = "sijaf_rt";
export const REMEMBER_COOKIE = "sijaf_remember";

// بنشيل التوكن من الكوكي قبل ما يخلص بشوية، عشان proxy يجدده قبل ما الـ API يرفضه
const ACCESS_EXPIRY_MARGIN_SECONDS = 30;

type CookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge?: number;
};

export type SessionCookie = { name: string; value: string; options: CookieOptions };

const base = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});

/**
 * الكوكيز اللي بتتكتب بعد الدخول أو التجديد.
 * لو «افتكرني» مش متعلّمة، الـ refresh token بيبقى session cookie ويتمسح لما المتصفح يتقفل.
 */
export function sessionCookies(tokens: AuthTokens, remember: boolean): SessionCookie[] {
  const persistent = remember ? { maxAge: tokens.refreshTokenExpiresIn } : {};
  return [
    {
      name: ACCESS_COOKIE,
      value: tokens.accessToken,
      options: { ...base(), maxAge: Math.max(tokens.accessTokenExpiresIn - ACCESS_EXPIRY_MARGIN_SECONDS, 1) },
    },
    { name: REFRESH_COOKIE, value: tokens.refreshToken, options: { ...base(), ...persistent } },
    { name: REMEMBER_COOKIE, value: remember ? "1" : "0", options: { ...base(), ...persistent } },
  ];
}

export function clearedSessionCookies(): SessionCookie[] {
  return [ACCESS_COOKIE, REFRESH_COOKIE, REMEMBER_COOKIE].map((name) => ({
    name,
    value: "",
    options: { ...base(), maxAge: 0 },
  }));
}
