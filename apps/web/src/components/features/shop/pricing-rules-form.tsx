"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { pricingRulesSchema, type PricingRules, type PricingRulesInput } from "@sijaf/shared";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, InputWithUnit } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { applyActionErrors, withDefault } from "@/lib/forms";
import { updatePricingRules } from "./actions";

/** «تكاليف وقواعد تانية»: التركيب والكرنيشة وعرض التوب والعربون وصلاحية العرض */
export function PricingRulesForm({ rules }: { rules: PricingRules }) {
  const form = useForm<PricingRulesInput, unknown, PricingRules>({
    resolver: zodResolver(pricingRulesSchema),
    defaultValues: rules,
  });
  const { errors, isSubmitting, isSubmitSuccessful, isDirty } = form.formState;

  const onSubmit = form.handleSubmit(async (data) => {
    const result = await updatePricingRules(data);
    if (applyActionErrors(result, form.setError, ["installationPerWindow", "cornicePerMeter", "defaultTopWidthM", "depositPercent", "validityDays"])) return;
    if (result.ok) form.reset(result.data);
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormError message={errors.root?.server?.message} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Field label="التركيب (للشباك)" error={errors.installationPerWindow?.message}>
          <InputWithUnit unit="ج.م" inputMode="decimal" {...withDefault(form, "installationPerWindow")} />
        </Field>
        <Field label="الكرنيشة (للمتر)" hint="لو مفيش كرنيشة في الكتالوج" error={errors.cornicePerMeter?.message}>
          <InputWithUnit unit="ج.م" inputMode="decimal" {...withDefault(form, "cornicePerMeter")} />
        </Field>
        <Field label="عرض توب القماش" hint="لو الخامة مالهاش عرض" error={errors.defaultTopWidthM?.message}>
          <InputWithUnit unit="متر" inputMode="decimal" {...withDefault(form, "defaultTopWidthM")} />
        </Field>
        <Field label="العربون المطلوب" error={errors.depositPercent?.message}>
          <InputWithUnit unit="%" inputMode="numeric" {...withDefault(form, "depositPercent")} />
        </Field>
        <Field label="صلاحية العرض" error={errors.validityDays?.message}>
          <InputWithUnit unit="يوم" inputMode="numeric" {...withDefault(form, "validityDays")} />
        </Field>
      </div>
      <details className="rounded-md border border-border">
        <summary className="flex min-h-11 cursor-pointer list-none items-center px-4 text-sm font-semibold text-primary">هوامش القص (متقدم)</summary>
        <div className="grid grid-cols-2 gap-4 border-t border-border p-4 lg:grid-cols-4">
          <Field label="زيادة المجرى" hint="على عرض الشباك">
            <InputWithUnit unit="متر" inputMode="decimal" {...withDefault(form, "allowances.rail")} />
          </Field>
          <Field label="زيادة القماش" hint="بعد الكشكشة">
            <InputWithUnit unit="متر" inputMode="decimal" {...withDefault(form, "allowances.flat")} />
          </Field>
          <Field label="زيادة الطول" hint="للتنيات">
            <InputWithUnit unit="متر" inputMode="decimal" {...withDefault(form, "allowances.drop")} />
          </Field>
          <Field label="التقريب" hint="لأقرب كام متر لفوق">
            <InputWithUnit unit="متر" inputMode="decimal" {...withDefault(form, "allowances.roundingStep")} />
          </Field>
        </div>
      </details>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "بنحفظ..." : "حفظ القواعد"}
          <Save aria-hidden />
        </Button>
        {isSubmitSuccessful && !isDirty && (
          <span role="status" className="text-sm font-semibold text-success">
            اتحفظت؛ العروض الجديدة هتتحسب بيها
          </span>
        )}
      </div>
    </form>
  );
}
