"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PASSWORD_MIN_LENGTH, registerSchema, type RegisterData, type RegisterInput } from "@sijaf/shared";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { applyActionErrors } from "@/lib/forms";
import { register } from "./actions";

export function RegisterForm() {
  const form = useForm<RegisterInput, unknown, RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { shopName: "", ownerName: "", phone: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (data) => {
    const result = await register(data);
    applyActionErrors(result, form.setError, ["shopName", "ownerName", "phone", "password"]);
  });

  const invalid = (name: keyof RegisterInput) => (errors[name] ? true : undefined);

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormError message={errors.root?.server?.message} />
      <Field label="اسم المحل" error={errors.shopName?.message}>
        <Input autoComplete="organization" placeholder="مثال: ستائر الأمل" aria-invalid={invalid("shopName")} className="h-12 md:h-11" {...form.register("shopName")} />
      </Field>
      <Field label="اسمك" error={errors.ownerName?.message}>
        <Input autoComplete="name" placeholder="مثال: محمد" aria-invalid={invalid("ownerName")} className="h-12 md:h-11" {...form.register("ownerName")} />
      </Field>
      <Field label="رقم الموبايل" hint="هتدخل بيه، وهيبقى رقم واتساب المحل" error={errors.phone?.message}>
        <Input
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="username"
          placeholder="01xxxxxxxxx"
          aria-invalid={invalid("phone")}
          className="h-12 text-end md:h-11"
          {...form.register("phone")}
        />
      </Field>
      <Field label="كلمة السر" hint={`${PASSWORD_MIN_LENGTH} حروف على الأقل`} error={errors.password?.message}>
        <Input type="password" autoComplete="new-password" aria-invalid={invalid("password")} className="h-12 md:h-11" {...form.register("password")} />
      </Field>
      <Button type="submit" size="lg" disabled={isSubmitting} className="h-13 text-md md:h-12">
        {isSubmitting ? "بنجهّز محلك..." : "سجّل محلك"}
      </Button>
    </form>
  );
}
