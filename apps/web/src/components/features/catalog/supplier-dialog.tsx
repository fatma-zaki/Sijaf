"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  formatEgyptianMobile,
  paymentLabels,
  paymentMethods,
  supplierSchema,
  type SupplierData,
  type SupplierDto,
  type SupplierInput,
} from "@sijaf/shared";
import { Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, InputWithUnit } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { applyActionErrors } from "@/lib/forms";
import { deleteSupplier, saveSupplier } from "./actions";

type SupplierDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: SupplierDto;
};

const optionalNumber = (value: unknown) => (value === "" || value === null || value === undefined ? null : value);

function toFormValues(supplier?: SupplierDto): SupplierInput {
  return {
    name: supplier?.name ?? "",
    specialty: supplier?.specialty ?? "",
    contactName: supplier?.contactName ?? "",
    whatsapp: supplier?.whatsapp ? formatEgyptianMobile(supplier.whatsapp) : "",
    address: supplier?.address ?? "",
    paymentMethod: supplier?.paymentMethod ?? "cash",
    creditDays: supplier?.creditDays ?? null,
    leadTimeMinDays: supplier?.leadTimeMinDays ?? null,
    leadTimeMaxDays: supplier?.leadTimeMaxDays ?? null,
  };
}

/** إضافة/تعديل مورد (Supplier-Add) */
export function SupplierDialog({ open, onOpenChange, supplier }: SupplierDialogProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  // لازم يبقى مختلف لكل نافذة: ممكن يبقى فيه نافذتين في نفس الصفحة (إضافة وتعديل)
  const formId = useId();
  const form = useForm<SupplierInput, unknown, SupplierData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: toFormValues(supplier),
  });
  const { errors, isSubmitting } = form.formState;
  const paymentMethod = useWatch({ control: form.control, name: "paymentMethod" });

  useEffect(() => {
    if (open) form.reset(toFormValues(supplier));
  }, [open, supplier, form]);

  const onSubmit = form.handleSubmit(async (data) => {
    const result = await saveSupplier(supplier?.id ?? null, data);
    if (applyActionErrors(result, form.setError, ["name", "whatsapp", "creditDays", "leadTimeMinDays", "leadTimeMaxDays"])) return;
    onOpenChange(false);
    // المورد الجديد يتفتح على طول
    if (!supplier && result.ok) router.push(`/catalog/suppliers?supplier=${result.data.id}`, { scroll: false });
  });

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title={supplier ? "تعديل بيانات المورد" : "إضافة مورد"}
        description={supplier ? undefined : "تقدر تربط خاماته بعد الحفظ"}
        footer={
          <>
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {isSubmitting ? "بنحفظ..." : "حفظ المورد"}
              <Save aria-hidden />
            </Button>
            <div className="flex gap-2">
              {supplier && (
                <Button variant="danger-ghost" onClick={() => setConfirmDelete(true)}>
                  حذف
                  <Trash2 aria-hidden />
                </Button>
              )}
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
            </div>
          </>
        }
      >
        <form id={formId} noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormError message={errors.root?.server?.message} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="اسم المورد" error={errors.name?.message}>
              <Input placeholder="مثال: الأناضول للأقمشة" aria-invalid={errors.name ? true : undefined} {...form.register("name")} />
            </Field>
            <Field label="التخصص">
              <Input placeholder="مثال: أقمشة تركية" {...form.register("specialty")} />
            </Field>
            <Field label="اسم المسؤول">
              <Input placeholder="مين بتتعامل معاه" {...form.register("contactName")} />
            </Field>
            <Field label="رقم واتساب" error={errors.whatsapp?.message}>
              <Input
                type="tel"
                dir="ltr"
                inputMode="tel"
                placeholder="01xxxxxxxxx"
                className="text-end"
                aria-invalid={errors.whatsapp ? true : undefined}
                {...form.register("whatsapp")}
              />
            </Field>
          </div>
          <Field label="العنوان">
            <Input placeholder="المنطقة والشارع" {...form.register("address")} />
          </Field>
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-2">طريقة الدفع</span>
              <Controller
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <SegmentedControl
                    label="طريقة الدفع"
                    value={field.value ?? "cash"}
                    onValueChange={field.onChange}
                    options={paymentMethods.map((value) => ({ value, label: paymentLabels[value] }))}
                  />
                )}
              />
            </div>
            {paymentMethod === "credit" && (
              <Field label="مدة الآجل" error={errors.creditDays?.message}>
                <InputWithUnit unit="يوم" inputMode="numeric" {...form.register("creditDays", { setValueAs: optionalNumber })} />
              </Field>
            )}
          </div>
          <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
            <legend className="mb-1.5 p-0 text-sm font-medium text-ink-2">مدة التوريد</legend>
            <div className="grid grid-cols-2 gap-4">
              <Field label="من" error={errors.leadTimeMinDays?.message}>
                <InputWithUnit unit="يوم" inputMode="numeric" {...form.register("leadTimeMinDays", { setValueAs: optionalNumber })} />
              </Field>
              <Field label="لحد" error={errors.leadTimeMaxDays?.message}>
                <InputWithUnit unit="يوم" inputMode="numeric" {...form.register("leadTimeMaxDays", { setValueAs: optionalNumber })} />
              </Field>
            </div>
          </fieldset>
        </form>
      </Dialog>

      {supplier && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`حذف «${supplier.name}»؟`}
          description="الخامات بتاعته هتفضل في الكتالوج من غير مورد."
          confirmLabel="حذف المورد"
          onConfirm={async () => {
            const result = await deleteSupplier(supplier.id);
            if (!result.ok) return result.message;
            onOpenChange(false);
            router.push("/catalog/suppliers", { scroll: false });
            return null;
          }}
        />
      )}
    </>
  );
}
