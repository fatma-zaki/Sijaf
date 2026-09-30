"use client";

import {
  layerLabels,
  type ItemBasis,
  type MaterialDto,
  type ModelItemInput,
  type ModelItemKind,
} from "@sijaf/shared";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, InputWithUnit, Select } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatCurrency } from "@/lib/format";

type AddItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: ModelItemKind;
  materials: MaterialDto[];
  onAdd: (item: ModelItemInput) => void;
};

/** الأساس الافتراضي: اللي بيتباع بالمتر الطولي بيتحسب على أمتار القماش، والقطعة للشباك */
function defaultBasis(material: MaterialDto | undefined, kind: ModelItemKind): ItemBasis {
  if (kind === "operation") return "per_window";
  return material?.unit === "linear_meter" ? "per_fabric_meter" : "per_window";
}

export function AddItemDialog({ open, onOpenChange, kind, materials, onAdd }: AddItemDialogProps) {
  const [source, setSource] = useState<"catalog" | "fixed">("catalog");
  const [materialId, setMaterialId] = useState("");
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  // الأنسب للنوع الأول (موتورات للتشغيل وإكسسوارات للإكسسوارات)، وبعدها الباقي
  const preferred = kind === "operation" ? "motor" : "accessory";
  const sorted = [...materials].sort((a, b) => Number(b.layer === preferred) - Number(a.layer === preferred));

  const reset = () => {
    setMaterialId("");
    setLabel("");
    setPrice("");
    setError(null);
  };

  const add = () => {
    if (source === "catalog") {
      const material = materials.find((m) => m.id === materialId);
      if (!material) return setError("اختار خامة من القايمة");
      onAdd({ kind, materialId, label: material.name, unitPrice: null, basis: defaultBasis(material, kind), quantity: 1, isRequired: true });
    } else {
      const value = Number(price);
      if (label.trim().length < 2) return setError("اكتب اسم البند");
      if (!Number.isFinite(value) || value < 0 || price === "") return setError("اكتب السعر");
      onAdd({ kind, materialId: null, label: label.trim(), unitPrice: value, basis: "per_window", quantity: 1, isRequired: true });
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      title={kind === "operation" ? "إضافة بند للتشغيل" : "إضافة إكسسوار"}
      className="w-120"
      footer={
        <>
          <Button onClick={add}>
            إضافة
            <Plus aria-hidden />
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </>
      }
    >
      <SegmentedControl
        label="مصدر البند"
        value={source}
        onValueChange={(value) => {
          setSource(value);
          setError(null);
        }}
        options={[
          { value: "catalog", label: "من الكتالوج" },
          { value: "fixed", label: "بسعر ثابت" },
        ]}
      />
      {source === "catalog" ? (
        materials.length > 0 ? (
          <Field label="الخامة" hint="السعر بيتحدث لوحده لما سعرها في الكتالوج يتغير">
            <Select value={materialId} onChange={(event) => setMaterialId(event.target.value)}>
              <option value="">اختار…</option>
              {sorted.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name} · {layerLabels[material.layer]} · {formatCurrency(material.sellPrice)}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <p className="m-0 text-sm text-ink-muted">الكتالوج فاضي. ضيف خامات الأول أو استخدم بند بسعر ثابت.</p>
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_140px]">
          <Field label="اسم البند">
            <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="مثال: تركيب وبرمجة الموتور" />
          </Field>
          <Field label="السعر">
            <InputWithUnit unit="ج.م" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} />
          </Field>
        </div>
      )}
      <FormError message={error ?? undefined} />
    </Dialog>
  );
}
