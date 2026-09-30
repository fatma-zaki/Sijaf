"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  curtainModelSchema,
  operationLabels,
  operations,
  pricingMethodLabels,
  pricingMethods,
  type CurtainModelData,
  type CurtainModelDto,
  type CurtainModelInput,
  type MaterialDto,
  type ModelItemKind,
} from "@sijaf/shared";
import { Blinds, Hand, Plus, Save, Trash2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, InputWithUnit, Select, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { applyActionErrors, withDefault } from "@/lib/forms";
import { deleteModel, saveModel } from "../actions";
import { AddItemDialog } from "./add-item-dialog";
import { ExtrasPreview } from "./extras-preview";
import { ModelItems, type ItemRow } from "./model-items";

function toFormValues(model?: CurtainModelDto): CurtainModelInput {
  if (!model) {
    return { name: "", pricingMethod: "linear_fullness", fullness: 2, laborPerUnit: "", operation: "manual", technicianNote: "", items: [] };
  }
  return {
    name: model.name,
    pricingMethod: model.pricingMethod,
    fullness: model.fullness,
    laborPerUnit: model.laborPerUnit,
    operation: model.operation,
    technicianNote: model.technicianNote,
    items: model.items.map((item) => ({
      kind: item.kind,
      materialId: item.materialId,
      label: item.label,
      unitPrice: item.unitPrice,
      basis: item.basis,
      quantity: item.quantity,
      isRequired: item.isRequired,
    })),
  };
}

const laborUnit: Record<CurtainModelInput["pricingMethod"], string> = {
  linear_fullness: "مصنعية المتر",
  square_meter: "مصنعية المتر المربع",
  piece: "مصنعية القطعة",
};

type ModelEditorProps = { model?: CurtainModelDto; materials: MaterialDto[] };

/** تعديل الموديل: الحساب والتشغيل والإكسسوارات، ومعاه مثال بيتحسب مع كل تغيير */
export function ModelEditor({ model, materials }: ModelEditorProps) {
  const router = useRouter();
  const [adding, setAdding] = useState<ModelItemKind | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const materialsById = useMemo(() => new Map(materials.map((material) => [material.id, material])), [materials]);

  const form = useForm<CurtainModelInput, unknown, CurtainModelData>({
    resolver: zodResolver(curtainModelSchema),
    defaultValues: toFormValues(model),
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const values = useWatch({ control: form.control }) as CurtainModelInput;
  const { errors, isSubmitting, isDirty } = form.formState;

  const rowsOf = (kind: ModelItemKind): ItemRow[] =>
    fields.flatMap((field, index) =>
      field.kind === kind ? [{ index, key: field.id, materialId: field.materialId ?? null, label: field.label ?? "" }] : [],
    );

  const onSubmit = form.handleSubmit(async (data) => {
    const result = await saveModel(model?.id ?? null, data);
    if (applyActionErrors(result, form.setError, ["name", "fullness", "laborPerUnit"])) return;
    if (result.ok) {
      form.reset(toFormValues(result.data));
      if (!model) router.replace(`/catalog/models?model=${result.data.id}`, { scroll: false });
    }
  });

  const motorized = values.operation === "motorized";
  const isLinear = values.pricingMethod === "linear_fullness";

  return (
    <form noValidate onSubmit={onSubmit} className="flex min-w-0 flex-col gap-4 lg:gap-6">
      <section aria-label="بيانات الموديل" className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3.5">
            <span aria-hidden className="grid size-13 flex-none place-items-center rounded-md border border-border bg-surface-subtle text-ink-muted">
              <Blinds className="size-6" />
            </span>
            <h2 className="m-0 text-2xl font-bold text-ink">{values.name || "موديل جديد"}</h2>
          </div>
          <div className="flex gap-2">
            {model && (
              <Button variant="danger-ghost" onClick={() => setConfirmDelete(true)}>
                حذف
                <Trash2 aria-hidden />
              </Button>
            )}
            <Button variant="secondary" disabled={!isDirty} onClick={() => form.reset(toFormValues(model))}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "بنحفظ..." : "حفظ الموديل"}
              <Save aria-hidden />
            </Button>
          </div>
        </div>
        <FormError message={errors.root?.server?.message} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Field label="اسم الموديل" error={errors.name?.message}>
            <Input aria-invalid={errors.name ? true : undefined} {...withDefault(form, "name")} />
          </Field>
          <Field label="طريقة الحساب">
            <Select {...withDefault(form, "pricingMethod")}>
              {pricingMethods.map((method) => (
                <option key={method} value={method}>
                  {pricingMethodLabels[method]}
                </option>
              ))}
            </Select>
          </Field>
          {isLinear && (
            <Field label="معامل الكشكشة" error={errors.fullness?.message}>
              <InputWithUnit unit="ضعف" inputMode="decimal" {...withDefault(form, "fullness")} />
            </Field>
          )}
          <Field label={laborUnit[values.pricingMethod ?? "linear_fullness"]} error={errors.laborPerUnit?.message}>
            <InputWithUnit unit="ج.م" inputMode="decimal" {...withDefault(form, "laborPerUnit")} />
          </Field>
        </div>
      </section>

      <section aria-label="التشغيل" className="flex flex-col rounded-lg border border-border bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <h3 className="m-0 text-md font-bold text-ink">التشغيل</h3>
            <Controller
              control={form.control}
              name="operation"
              render={({ field }) => (
                <SegmentedControl
                  label="طريقة التشغيل"
                  value={field.value ?? "manual"}
                  onValueChange={field.onChange}
                  options={operations.map((value) => ({
                    value,
                    label: operationLabels[value],
                    icon: value === "manual" ? <Hand aria-hidden /> : <Zap aria-hidden />,
                  }))}
                />
              )}
            />
          </div>
          {motorized && (
            <Button variant="ghost" size="sm" onClick={() => setAdding("operation")}>
              إضافة من الكتالوج
              <Plus aria-hidden />
            </Button>
          )}
        </div>
        {motorized ? (
          <ModelItems
            rows={rowsOf("operation")}
            materials={materialsById}
            form={form}
            onRemove={remove}
            emptyText="ضيف الموتور والريموت والتركيب؛ بيدخلوا العرض لما التشغيل يبقى موتور."
          />
        ) : (
          <p className="m-0 px-5 pb-5 text-sm text-ink-muted">يدوي: مفيش موتور. لو الموديل ده بريموت، اختار «موتور بريموت» وضيف الموتور والريموت.</p>
        )}
        <div className="border-t border-border p-5">
          <Field label="تنبيه للفني وقت المعاينة" hint="بيظهر للفني وهو بيعمل العرض">
            <Textarea rows={2} placeholder="مثال: محتاج نقطة كهربا جنب الشباك" {...withDefault(form, "technicianNote")} />
          </Field>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
        <section aria-label="إكسسوارات الموديل" className="flex flex-col rounded-lg border border-border bg-surface shadow-card">
          <div className="flex items-center justify-between gap-3 p-5">
            <h3 className="m-0 text-md font-bold text-ink">إكسسوارات الموديل</h3>
            <Button variant="ghost" size="sm" onClick={() => setAdding("accessory")}>
              إضافة إكسسوار
              <Plus aria-hidden />
            </Button>
          </div>
          <ModelItems
            rows={rowsOf("accessory")}
            materials={materialsById}
            form={form}
            onRemove={remove}
            emptyText="مفيش إكسسوارات. ضيف الشريط أو الحلقات أو المسكات لو الموديل محتاجها."
          />
        </section>
        <ExtrasPreview values={values} materials={materialsById} />
      </div>

      <AddItemDialog
        open={adding !== null}
        onOpenChange={(open) => !open && setAdding(null)}
        kind={adding ?? "accessory"}
        materials={materials}
        onAdd={(item) => append(item)}
      />
      {model && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`حذف موديل «${model.name}»؟`}
          description="مش هيظهر في العروض الجديدة. العروض القديمة مش هتتأثر."
          confirmLabel="حذف الموديل"
          onConfirm={async () => {
            const result = await deleteModel(model.id);
            if (!result.ok) return result.message;
            router.replace("/catalog/models", { scroll: false });
            return null;
          }}
        />
      )}
    </form>
  );
}
