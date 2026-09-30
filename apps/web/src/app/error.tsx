"use client";

import { LoadError } from "@/components/layout/load-error";

/** خطأ قبل ما القايمة نفسها تتحمّل (زي تحميل بيانات الجلسة في الـ layout) */
export default function RootError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-160 flex-col justify-center p-4">
      <LoadError retry={retry} className="grow-0" />
    </main>
  );
}
