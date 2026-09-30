/** صفحات الدخول: اللي مسجّل دخول بيرجع للرئيسية */
const AUTH_PAGES = ["/login", "/register"];

/** صفحات مفتوحة من غير تسجيل دخول */
const PUBLIC_PREFIXES = ["/forgot-password", "/design-system", "/q/", "/auth/signout"];

export type AuthDecision = "allow" | "refresh" | "to-login" | "to-home";

function matches(pathname: string, prefix: string): boolean {
  return prefix.endsWith("/") ? pathname.startsWith(prefix) : pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((page) => matches(pathname, page));
}

/** قرار proxy.ts لكل طلب، حسب المسار والكوكيز الموجودة */
export function decideAuth(pathname: string, session: { access: boolean; refresh: boolean }): AuthDecision {
  if (PUBLIC_PREFIXES.some((prefix) => matches(pathname, prefix))) return "allow";
  const authPage = isAuthPage(pathname);
  if (session.access) return authPage ? "to-home" : "allow";
  if (session.refresh) return "refresh";
  return authPage ? "allow" : "to-login";
}

/** مسار الرجوع بعد الدخول، ومش بيسمح بلينكات برا الموقع */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return isAuthPage(value) ? "/" : value;
}
