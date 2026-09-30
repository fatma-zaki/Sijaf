"use client";

import type { TemplateApplyResult } from "@sijaf/shared";
import { useState, useTransition } from "react";
import { applyTemplate } from "./actions";

/** «استخدم القائمة الجاهزة»: الحالة والخطأ لأي زرار بيطبّقها */
export function useApplyTemplate(onApplied?: (result: TemplateApplyResult) => void) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const apply = () =>
    startTransition(async () => {
      setError(null);
      const result = await applyTemplate();
      if (!result.ok) return setError(result.message);
      onApplied?.(result.data);
    });

  return { apply, pending, error };
}
