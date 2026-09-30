"use server";

import { loginSchema, registerSchema, type AuthTokens } from "@sijaf/shared";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { runAction } from "@/lib/actions";
import type { ActionResult } from "@/lib/action-result";
import { apiRequest } from "@/lib/api/server";
import { REFRESH_COOKIE, clearedSessionCookies, sessionCookies } from "@/lib/auth/cookies";
import { safeNextPath } from "@/lib/auth/routes";

async function saveSession(tokens: AuthTokens, remember: boolean) {
  const store = await cookies();
  for (const cookie of sessionCookies(tokens, remember)) store.set(cookie.name, cookie.value, cookie.options);
}

export async function login(input: unknown, next: string | null): Promise<ActionResult> {
  const result = await runAction(loginSchema, input, async (data) => {
    const tokens = await apiRequest<AuthTokens>("/auth/login", {
      method: "POST",
      auth: false,
      body: { phone: data.phone, password: data.password },
    });
    await saveSession(tokens, data.remember);
  });
  if (result.ok) redirect(safeNextPath(next));
  return result;
}

export async function register(input: unknown): Promise<ActionResult> {
  const result = await runAction(registerSchema, input, async (data) => {
    const tokens = await apiRequest<AuthTokens>("/auth/register", { method: "POST", auth: false, body: data });
    await saveSession(tokens, true);
  });
  if (result.ok) redirect("/onboarding/shop");
  return result;
}

export async function logout(): Promise<void> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    try {
      await apiRequest("/auth/logout", { method: "POST", auth: false, body: { refreshToken } });
    } catch {
      // حتى لو الـ API مش متاح، بنمسح الجلسة من المتصفح
    }
  }
  for (const cookie of clearedSessionCookies()) store.set(cookie.name, cookie.value, cookie.options);
  redirect("/login");
}
