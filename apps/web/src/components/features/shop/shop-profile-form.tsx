"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  formatEgyptianMobile,
  shopProfileSchema,
  type ShopDto,
  type ShopProfileData,
  type ShopProfileInput,
} from "@sijaf/shared";
import { Save } from "lucide-react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { applyActionErrors } from "@/lib/forms";
import { updateShopProfile } from "./actions";

type ShopProfileFormProps = {
  shop: ShopDto;
  submitLabel: string;
  /** بعد الحفظ (في الـ onboarding بيروح للخطوة اللي بعدها) */
  onSaved?: () => void;
  /** زرار إضافي جنب الحفظ */
  secondaryAction?: ReactNode;
};

export function ShopProfileForm({ shop, submitLabel, onSaved, secondaryAction }: ShopProfileFormProps) {
  const form = useForm<ShopProfileInput, unknown, ShopProfileData>({
    resolver: zodResolver(shopProfileSchema),
    defaultValues: {
      name: shop.name,
      whatsapp: shop.whatsapp ? formatEgyptianMobile(shop.whatsapp) : "",
      address: shop.address,
    },
  });
  const { errors, isSubmitting, isSubmitSuccessful, isDirty } = form.formState;

  const onSubmit = form.handleSubmit(async (data) => {
    const result = await updateShopProfile(data);
    if (applyActionErrors(result, form.setError, ["name", "whatsapp", "address"])) return;
    form.reset(form.getValues());
    onSaved?.();
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormError message={errors.root?.server?.message} />
      <Field label="اسم المحل" error={errors.name?.message}>
        <Input autoComplete="organization" aria-invalid={errors.name ? true : undefined} {...form.register("name")} />
      </Field>
      <Field label="رقم واتساب المحل" hint="العروض بتتبعت للعملاء منه" error={errors.whatsapp?.message}>
        <Input
          type="tel"
          dir="ltr"
          inputMode="tel"
          placeholder="01xxxxxxxxx"
          aria-invalid={errors.whatsapp ? true : undefined}
          className="text-end"
          {...form.register("whatsapp")}
        />
      </Field>
      <Field label="العنوان" error={errors.address?.message}>
        <Input autoComplete="street-address" placeholder="المنطقة والشارع" {...form.register("address")} />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-45">
          {isSubmitting ? "بنحفظ..." : submitLabel}
          <Save aria-hidden />
        </Button>
        {secondaryAction}
        {isSubmitSuccessful && !isDirty && !onSaved && (
          <span role="status" className="text-sm font-semibold text-success">
            اتحفظت التغييرات
          </span>
        )}
      </div>
    </form>
  );
}
