"use client";

import { useState } from "react";
import { Hand, Plus, Save, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, InputWithUnit, Select } from "@/components/ui/field";
import { FilterChips } from "@/components/ui/filter-chips";
import { NumberField } from "@/components/ui/number-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { TierCard } from "@/components/ui/tier-card";
import { UploadDrop } from "@/components/ui/upload-drop";
import { sampleTiers } from "./samples";

type TierId = (typeof sampleTiers)[number]["id"];

export function TierDemo() {
  const [selected, setSelected] = useState<TierId>("standard");
  const cardProps = (tier: (typeof sampleTiers)[number]) => ({
    name: tier.name,
    price: tier.price,
    description: tier.description,
    selected: selected === tier.id,
    onSelect: () => setSelected(tier.id),
    ribbon: tier.id === "standard" ? "الأكثر استخداماً" : undefined,
    premium: tier.id === "premium",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 pt-2.5 md:grid-cols-3">
        {sampleTiers.map((tier) => (
          <TierCard key={tier.id} {...cardProps(tier)} />
        ))}
      </div>
      <div className="flex max-w-97.5 flex-col gap-2.5">
        {[...sampleTiers].reverse().map((tier) => (
          <TierCard key={tier.id} layout="row" {...cardProps(tier)} />
        ))}
      </div>
    </div>
  );
}

export function ControlsDemo() {
  const [width, setWidth] = useState<number | null>(300);
  const [height, setHeight] = useState<number | null>(260);
  const [tier, setTier] = useState<"economy" | "standard" | "premium">("standard");
  const [operation, setOperation] = useState<"manual" | "motor">("motor");
  const [status, setStatus] = useState("all");
  const [required, setRequired] = useState(true);
  const [optional, setOptional] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 md:max-w-120">
        <NumberField label="العرض (سم)" value={width} onValueChange={setWidth} min={0} />
        <NumberField label="الارتفاع (سم)" value={height} onValueChange={setHeight} min={0} hint="من الأرض للسقف" />
      </div>
      <div className="grid gap-4 md:max-w-120">
        <SegmentedControl
          label="المستوى"
          value={tier}
          onValueChange={setTier}
          options={[
            { value: "economy", label: "اقتصادي" },
            { value: "standard", label: "متوسط" },
            { value: "premium", label: "فاخر" },
          ]}
        />
        <SegmentedControl
          label="طريقة التشغيل"
          value={operation}
          onValueChange={setOperation}
          options={[
            { value: "manual", label: "يدوي", icon: <Hand aria-hidden /> },
            { value: "motor", label: "موتور بريموت", icon: <Zap aria-hidden /> },
          ]}
        />
      </div>
      <FilterChips
        label="تصفية حسب الحالة"
        value={status}
        onValueChange={setStatus}
        options={[
          { value: "all", label: "الكل" },
          { value: "draft", label: "مسودة" },
          { value: "review", label: "قيد المراجعة" },
          { value: "sent", label: "أُرسل للعميل" },
          { value: "accepted", label: "تم القبول" },
        ]}
      />
      <div className="flex flex-wrap gap-6">
        <Switch checked={required} onCheckedChange={setRequired} label={required ? "إجباري" : "اختياري"} aria-label="الموتور إجباري" />
        <Switch checked={optional} onCheckedChange={setOptional} label={optional ? "إجباري" : "اختياري"} aria-label="الشراشيب إجبارية" />
        <Switch disabled label="معطّل" />
      </div>
    </div>
  );
}

export function UploadDemo() {
  const [names, setNames] = useState<string[]>([]);
  return (
    <div className="flex flex-col gap-2">
      <UploadDrop
        title="اسحب صورة الستارة هنا"
        buttonLabel="رفع صورة"
        hint="يمكنك رفع أكثر من صورة • JPG / PNG"
        multiple
        onFiles={(files) => setNames(files.map((file) => file.name))}
      />
      {names.length > 0 && <p className="m-0 text-xs text-ink-muted">اتختار: {names.join("، ")}</p>}
    </div>
  );
}

export function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        إضافة خامة
        <Plus aria-hidden />
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="إضافة خامة"
        description="بتظهر في الكتالوج وبتدخل في حساب العروض"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>
              حفظ الخامة
              <Save aria-hidden />
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
          </>
        }
      >
        <Field label="اسم الخامة">
          <Input defaultValue="قطيفة تركي" />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="الطبقة">
            <Select defaultValue="main">
              <option value="main">قماش أساسي</option>
              <option value="sheer">شيفون</option>
              <option value="lining">بطانة</option>
            </Select>
          </Field>
          <Field label="سعر البيع">
            <InputWithUnit unit="ج.م" inputMode="decimal" defaultValue="560" />
          </Field>
        </div>
      </Dialog>
    </>
  );
}
