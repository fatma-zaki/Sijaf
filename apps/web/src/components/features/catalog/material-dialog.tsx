"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CORNICE_LOOK,
  TRACK_LOOK,
  layerLabels,
  materialLayers,
  materialSchema,
  materialUnits,
  stockLabels,
  stockStatuses,
  suggestedLooks,
  tierLabels,
  tiers,
  unitLabels,
  type MaterialData,
  type MaterialDto,
  type MaterialInput,
  type MaterialLayer,
} from "@sijaf/shared";
import { Save } from "lucide-react";
import { useEffect, useId } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, InputWithUnit, Select } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { applyActionErrors } from "@/lib/forms";
import { saveMaterial } from "./actions";
import { MarginLabel } from "./labels";

export type SupplierOption = { id: string; name: string };

type MaterialDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: SupplierOption[];
  /** للتعديل؛ من غيره إضافة */
  material?: MaterialDto;
  defaults?: Partial<MaterialInput>;
};

/** الفاضي يبقى null مش 0 */
const optionalNumber = (value: unknown) => (value === "" || value === null || value === undefined ? null : value);

/** الطبقات اللي ليها عرض توب (قماش بيتفصّل) */
const hasTopWidth = (layer: MaterialLayer) => layer === "sheer" || layer === "main" || layer === "lining";

function toFormValues(material?: MaterialDto, defaults?: Partial<MaterialInput>): MaterialInput {
  if (!material) {
    return {
      name: "",
      layer: "main",
      look: "",
      tier: "standard",
      unit: "meter",
      supplierId: null,
      supplierCode: "",
      purchasePrice: null,
      sellPrice: "",
      topWidthM: 3,
      stockStatus: "available",
      ...defaults,
    };
  }
  return {
    name: material.name,
    layer: material.layer,
    look: material.look ?? "",
    tier: material.tier,
    unit: material.unit,
    supplierId: material.supplierId,
    supplierCode: material.supplierCode,
    purchasePrice: material.purchasePrice,
    sellPrice: material.sellPrice,
    topWidthM: material.topWidthM,
    stockStatus: material.stockStatus,
  };
}

export function MaterialDialog({ open, onOpenChange, suppliers, material, defaults }: MaterialDialogProps) {
  const looksId = useId();
  // لازم يبقى مختلف لكل نافذة: ممكن يبقى فيه نافذتين في نفس الصفحة (إضافة وتعديل)
  const formId = useId();
  const form = useForm<MaterialInput, unknown, MaterialData>({
    resolver: zodResolver(materialSchema),
    defaultValues: toFormValues(material, defaults),
  });
  const { errors, isSubmitting } = form.formState;
  const [layer, purchasePrice, sellPrice] = useWatch({ control: form.control, name: ["layer", "purchasePrice", "sellPrice"] });

  // كل ما النافذة تتفتح تبدأ من بيانات الخامة (أو فاضية)
  useEffect(() => {
    if (open) form.reset(toFormValues(material, defaults));
  }, [open, material, defaults, form]);

  const onSubmit = form.handleSubmit(async (data) => {
    const result = await saveMaterial(material?.id ?? null, data);
    if (applyActionErrors(result, form.setError, ["name", "layer", "look", "supplierId", "purchasePrice", "sellPrice", "topWidthM"])) return;
    onOpenChange(false);
  });

  const onLayerChange = (next: MaterialLayer) => {
    form.setValue("layer", next);
    form.setValue("look", next === "track" ? TRACK_LOOK : "");
    form.setValue("unit", next === "track" ? "linear_meter" : next === "motor" || next === "accessory" ? "piece" : "meter");
    form.setValue("topWidthM", hasTopWidth(next) ? 3 : null);
  };

  const invalid = (name: keyof MaterialInput) => (errors[name] ? true : undefined);
  const purchase = Number(optionalNumber(purchasePrice) ?? Number.NaN);
  const sell = Number(sellPrice);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={material ? "تعديل خامة" : "إضافة خامة"}
      description="بتظهر في الكتالوج وبتدخل في حساب العروض"
      footer={
        <>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? "بنحفظ..." : "حفظ الخامة"}
            <Save aria-hidden />
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormError message={errors.root?.server?.message} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_160px]">
          <Field label="اسم الخامة" error={errors.name?.message}>
            <Input aria-invalid={invalid("name")} {...form.register("name")} />
          </Field>
          <Field label="كود المورد" error={errors.supplierCode?.message}>
            <Input dir="ltr" className="text-end" {...form.register("supplierCode")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="الطبقة" error={errors.layer?.message}>
            <Select value={layer} onChange={(event) => onLayerChange(event.target.value as MaterialLayer)}>
              {materialLayers.map((value) => (
                <option key={value} value={value}>
                  {layerLabels[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="الشكل" hint={layer === "track" ? undefined : "بيساعد كل مستوى ياخد خامة من نفس الشكل"} error={errors.look?.message}>
            {layer === "track" ? (
              <Select {...form.register("look")}>
                <option value={TRACK_LOOK}>{TRACK_LOOK}</option>
                <option value={CORNICE_LOOK}>{CORNICE_LOOK}</option>
              </Select>
            ) : (
              <Input list={looksId} placeholder="مثال: قطيفة" {...form.register("look")} />
            )}
          </Field>
          <datalist id={looksId}>
            {(suggestedLooks[layer] ?? []).map((look) => (
              <option key={look} value={look} />
            ))}
          </datalist>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-2">المستوى</span>
          <Controller
            control={form.control}
            name="tier"
            render={({ field }) => (
              <SegmentedControl
                label="المستوى"
                value={field.value ?? "standard"}
                onValueChange={field.onChange}
                options={tiers.map((value) => ({ value, label: tierLabels[value] }))}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="المورد" error={errors.supplierId?.message}>
            <Select {...form.register("supplierId", { setValueAs: (value) => (value ? value : null) })}>
              <option value="">من غير مورد</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="الوحدة">
            <Select {...form.register("unit")}>
              {materialUnits.map((value) => (
                <option key={value} value={value}>
                  {unitLabels[value]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-md bg-surface-subtle p-4 md:grid-cols-3">
          <Field label="سعر الشراء" error={errors.purchasePrice?.message}>
            <InputWithUnit
              unit="ج.م"
              inputMode="decimal"
              aria-invalid={invalid("purchasePrice")}
              {...form.register("purchasePrice", { setValueAs: optionalNumber })}
            />
          </Field>
          <Field label="سعر البيع" error={errors.sellPrice?.message}>
            <InputWithUnit unit="ج.م" inputMode="decimal" aria-invalid={invalid("sellPrice")} {...form.register("sellPrice")} />
          </Field>
          <div className="col-span-2 flex flex-col gap-1.5 md:col-span-1">
            <span className="text-sm font-medium text-ink-2">هامش الربح</span>
            <span className="flex h-10 items-center text-2xl" aria-live="polite">
              {Number.isFinite(sell) && sell > 0 && Number.isFinite(purchase) ? (
                <MarginLabel purchasePrice={purchase} sellPrice={sell} />
              ) : (
                <span className="text-base text-ink-muted">—</span>
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {hasTopWidth(layer ?? "main") && (
            <Field label="عرض التوب" error={errors.topWidthM?.message}>
              <InputWithUnit unit="متر" inputMode="decimal" {...form.register("topWidthM", { setValueAs: optionalNumber })} />
            </Field>
          )}
          <Field label="المخزون">
            <Select {...form.register("stockStatus")}>
              {stockStatuses.map((value) => (
                <option key={value} value={value}>
                  {stockLabels[value]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </form>
    </Dialog>
  );
}
