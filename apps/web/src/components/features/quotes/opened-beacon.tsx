"use client";

import { useEffect } from "react";

/** بيسجّل «العميل فتح رابط العرض» من المتصفح بس (مش من معاينة الرابط في واتساب) */
export function OpenedBeacon({ token }: { token: string }) {
  useEffect(() => {
    const url = `/q/${encodeURIComponent(token)}/opened`;
    if (!navigator.sendBeacon?.(url)) void fetch(url, { method: "POST", keepalive: true }).catch(() => undefined);
  }, [token]);
  return null;
}
