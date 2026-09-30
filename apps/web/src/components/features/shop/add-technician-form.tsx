"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  PASSWORD_MIN_LENGTH,
  createTechnicianSchema,
  type CreateTechnicianData,
  type CreateTechnicianInput,
} from "@sijaf/shared";
import { UserPlus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { applyActionErrors } from "@/lib/forms";
import { addTechnician } from "./actions";

const DEFAULT_TITLES = ["فني معاينة", "فني تركيب"];
const DEFAULTS: CreateTechnicianInput = { fullName: "", phone: "", password: "", jobTitle: DEFAULT_TITLES[0], canQuote: true };

/** صاحب المحل بيضيف فني بكلمة سر مبدئية، ويبعتهاله */
export function AddTechnicianForm({ onAdded }: { onAdded?: () => void }) {
  const form = useForm<CreateTechnicianInput, unknown, CreateTechnicianData>({
    resolver: zodResolver(createTechnicianSchema),
    defaultValues: DEFAULTS,
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (data) => {
    const result = await addTechnician(data);
    if (applyActionErrors(result, form.setError, ["fullName", "phone", "password", "jobTitle"])) return;
    form.reset(DEFAULTS);
    onAdded?.();
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormError message={errors.root?.server?.message} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="اسم الفني" error={errors.fullName?.message}>
          <Input autoComplete="off" aria-invalid={errors.fullName ? true : undefined} {...form.register("fullName")} />
        </Field>
        <Field label="رقم الموبايل" hint="هيدخل بيه" error={errors.phone?.message}>
          <Input
            type="tel"
            dir="ltr"
            inputMode="tel"
            placeholder="01xxxxxxxxx"
            autoComplete="off"
            aria-invalid={errors.phone ? true : undefined}
            className="text-end"
            {...form.register("phone")}
          />
        </Field>
        <Field label="كلمة سر مبدئية" hint={`${PASSWORD_MIN_LENGTH} حروف على الأقل، ابعتهاله`} error={errors.password?.message}>
          <Input type="text" autoComplete="new-password" aria-invalid={errors.password ? true : undefined} {...form.register("password")} />
        </Field>
        <Field label="المسمى" error={errors.jobTitle?.message}>
          <Input placeholder="فني معاينة" {...form.register("jobTitle")} />
        </Field>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-2">الصلاحيات</span>
        <Controller
          control={form.control}
          name="canQuote"
          render={({ field }) => (
            <SegmentedControl
              label="الصلاحيات"
              value={field.value ? "quotes" : "schedule"}
              onValueChange={(value) => {
                const canQuote = value === "quotes";
                field.onChange(canQuote);
                // المسمى بيمشي مع الصلاحية طالما صاحب المحل ماكتبش مسمى بنفسه
                const jobTitle = form.getValues("jobTitle");
                if (!jobTitle || DEFAULT_TITLES.includes(jobTitle)) {
                  form.setValue("jobTitle", canQuote ? DEFAULT_TITLES[0] : DEFAULT_TITLES[1]);
                }
              }}
              options={[
                { value: "quotes", label: "عروض الأسعار والمواعيد" },
                { value: "schedule", label: "المواعيد بس" },
              ]}
            />
          )}
        />
        <span className="text-xs text-ink-muted">الفني مابيشوفش أسعار الشراء ولا هامش الربح في الحالتين.</span>
      </div>
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "بنضيف..." : "إضافة الفني"}
          <UserPlus aria-hidden />
        </Button>
      </div>
    </form>
  );
}
