"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginData, type LoginInput } from "@sijaf/shared";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { applyActionErrors } from "@/lib/forms";
import { login } from "./actions";

export function LoginForm({ next }: { next: string | null }) {
  const form = useForm<LoginInput, unknown, LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", password: "", remember: true },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (data) => {
    const result = await login(data, next);
    applyActionErrors(result, form.setError, ["phone", "password"]);
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4 md:gap-4.5">
      <FormError message={errors.root?.server?.message} />
      <Field label="رقم الموبايل" error={errors.phone?.message}>
        <Input
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="username"
          placeholder="01xxxxxxxxx"
          aria-invalid={errors.phone ? true : undefined}
          className="h-12 text-end md:h-11"
          {...form.register("phone")}
        />
      </Field>
      <Field label="كلمة السر" error={errors.password?.message}>
        <Input
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          className="h-12 md:h-11"
          {...form.register("password")}
        />
      </Field>
      <div className="flex items-center justify-between text-sm">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-ink-2">
          <input type="checkbox" className="size-4.5 accent-primary" {...form.register("remember")} />
          افتكرني
        </label>
        <Link href="/forgot-password" className="font-semibold">
          نسيت كلمة السر؟
        </Link>
      </div>
      <Button type="submit" size="lg" disabled={isSubmitting} className="h-13 text-md md:h-12">
        {isSubmitting ? "بندخّلك..." : "دخول"}
      </Button>
    </form>
  );
}
