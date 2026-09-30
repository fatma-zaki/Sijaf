"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/**
 * الفلاتر والبحث في الـ URL (عشان الصفحة تفضل Server Component وتتحفظ في اللينك).
 * أي تغيير بيرجّع للصفحة الأولى.
 */
export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      if (!("page" in changes)) next.delete("page");
      const query = next.toString();
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
    },
    [params, pathname, router],
  );

  return { params, update, pending };
}
