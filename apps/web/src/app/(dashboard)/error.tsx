"use client";

import { LoadError } from "@/components/layout/load-error";

/** خطأ في صفحة جوه لوحة المحل: بيظهر جوه القايمة الجانبية */
export default function DashboardError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <LoadError retry={retry} />;
}
