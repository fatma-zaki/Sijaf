"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createClientSchema, type CreateClientData, type CreateClientInput } from "@sijaf/shared";
import { Plus, Save } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { applyActionErrors } from "@/lib/forms";
import { addClient } from "./actions";

const EMPTY: CreateClientInput = { name: "", phone: "", area: "", address: "" };

/** «إضافة عميل»: لعملاء المحل القدام (الجداد بيتضافوا لوحدهم مع العروض) */
export function AddClientButton({ label = "إضافة عميل", variant = "primary", className }: { label?: string; variant?: ButtonVariant; className?: string }) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const form = useForm<CreateClientInput, unknown, CreateClientData>({ resolver: zodResolver(createClientSchema), defaultValues: EMPTY });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (open) form.reset(EMPTY);
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (data) => {
    const result = await addClient(data);
    if (applyActionErrors(result, form.setError, ["name", "phone", "area", "address"])) return;
    setOpen(false);
  });

  return (
    <>
      <Button variant={variant} className={className} onClick={() => setOpen(true)}>
        {label}
        <Plus aria-hidden />
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="إضافة عميل"
        description="عروضه الجاية هتتربط بيه برقم الموبايل"
        className="w-120"
        footer={
          <>
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {isSubmitting ? "بنحفظ..." : "حفظ العميل"}
              <Save aria-hidden />
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
          </>
        }
      >
        <form id={formId} noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormError message={errors.root?.server?.message} />
          <Field label="اسم العميل" error={errors.name?.message}>
            <Input aria-invalid={errors.name ? true : undefined} {...form.register("name")} />
          </Field>
          <Field label="رقم الموبايل" error={errors.phone?.message}>
            <Input
              type="tel"
              dir="ltr"
              inputMode="tel"
              placeholder="01xxxxxxxxx"
              className="text-end"
              aria-invalid={errors.phone ? true : undefined}
              {...form.register("phone")}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="المنطقة" error={errors.area?.message}>
              <Input placeholder="مثال: المعادي" {...form.register("area")} />
            </Field>
            <Field label="العنوان" error={errors.address?.message}>
              <Input placeholder="الشارع ورقم العمارة" {...form.register("address")} />
            </Field>
          </div>
        </form>
      </Dialog>
    </>
  );
}
