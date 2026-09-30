import type { AuthTokens } from "@sijaf/shared";
import { describe, expect, it } from "vitest";
import { ACCESS_COOKIE, REFRESH_COOKIE, REMEMBER_COOKIE, clearedSessionCookies, sessionCookies } from "./cookies";
import { decideAuth, safeNextPath } from "./routes";

const none = { access: false, refresh: false };
const withAccess = { access: true, refresh: true };
const refreshOnly = { access: false, refresh: true };

describe("decideAuth", () => {
  it("lets public pages through without a session", () => {
    expect(decideAuth("/q/abc123", none)).toBe("allow");
    expect(decideAuth("/design-system", none)).toBe("allow");
    expect(decideAuth("/forgot-password", none)).toBe("allow");
  });

  it("sends guests to login from protected pages", () => {
    expect(decideAuth("/", none)).toBe("to-login");
    expect(decideAuth("/settings", none)).toBe("to-login");
    expect(decideAuth("/onboarding/shop", none)).toBe("to-login");
  });

  it("shows the login page to guests and sends signed-in users home", () => {
    expect(decideAuth("/login", none)).toBe("allow");
    expect(decideAuth("/register", none)).toBe("allow");
    expect(decideAuth("/login", withAccess)).toBe("to-home");
  });

  it("refreshes when only the refresh token is left", () => {
    expect(decideAuth("/quotes", refreshOnly)).toBe("refresh");
    expect(decideAuth("/login", refreshOnly)).toBe("refresh");
  });

  it("does not treat look-alike paths as public", () => {
    expect(decideAuth("/design-system-admin", none)).toBe("to-login");
    expect(decideAuth("/loginx", none)).toBe("to-login");
  });
});

describe("safeNextPath", () => {
  it("keeps internal paths only", () => {
    expect(safeNextPath("/quotes?status=sent")).toBe("/quotes?status=sent");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
    expect(safeNextPath("/login")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
  });
});

describe("session cookies", () => {
  const tokens: AuthTokens = {
    accessToken: "a",
    accessTokenExpiresIn: 900,
    refreshToken: "r",
    refreshTokenExpiresIn: 2_592_000,
  };
  const byName = (cookies: ReturnType<typeof sessionCookies>) => Object.fromEntries(cookies.map((c) => [c.name, c]));

  it("are httpOnly and expire the access token a bit early", () => {
    const cookies = byName(sessionCookies(tokens, true));
    expect(cookies[ACCESS_COOKIE].options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 870 });
    expect(cookies[REFRESH_COOKIE].options.maxAge).toBe(2_592_000);
    expect(cookies[REMEMBER_COOKIE].value).toBe("1");
  });

  it("make the refresh token a session cookie without «remember me»", () => {
    const cookies = byName(sessionCookies(tokens, false));
    expect(cookies[REFRESH_COOKIE].options.maxAge).toBeUndefined();
    expect(cookies[REMEMBER_COOKIE].value).toBe("0");
  });

  it("clears all three", () => {
    expect(clearedSessionCookies().map((c) => [c.name, c.options.maxAge])).toEqual([
      [ACCESS_COOKIE, 0],
      [REFRESH_COOKIE, 0],
      [REMEMBER_COOKIE, 0],
    ]);
  });
});
