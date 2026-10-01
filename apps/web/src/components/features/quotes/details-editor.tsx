"use client";

import {
  CORNICE_LOOK,
  TRACK_LOOK,
  componentSlotLabels,
  componentSlots,
  operationLabels,
  tierLabels,
  type ComponentSlot,
  type CurtainModelDto,
  type MaterialPublicDto,
  type Operation,
  type QuoteDto,
} from "@sijaf/shared";
import { Blinds, Calculator, Layers, Layers2, RefreshCw, RotateCcw, Ruler, Sparkles, Trash2, TriangleAlert, Wind, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/ui/confidence";
import { Select } from "@/components/ui/field";
import { FilterChips } from "@/components/ui/filter-chips";
import { FormError } from "@/components/ui/form-error";
import { InfoNote } from "@/components/ui/info-note";
import { NumberField } from "@/components/ui/number-field";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { saveQuoteDetails } from "./actions";
import { componentSource } from "./quote-format";
import { QuotePhoto } from "./quote-photo";
import { usePhotoUpload } from "./use-photo-upload";

type Row = { slot: ComponentSlot; materialId: string | null; included: boolean };

const slotIcons: Record<ComponentSlot, LucideIcon> = { sheer: Wind, main: Blinds, lining: Layers2, track: Ruler, cornice: Layers };

function fitsSlot(material: MaterialPublicDto, slot: ComponentSlot): boolean {
  if (slot === "track") return material.layer === "track" && material.look === TRACK_LOOK;
  if (slot === "cornice") return material.layer === "track" && material.look === CORNICE_LOOK;
  return material.layer === slot;
}

function initialRows(quote: QuoteDto): Row[] {
  return componentSlots.map((slot) => {
    const saved = quote.components.find((c) => c.slot === slot);
    return { slot, materialId: saved?.materialId ?? null, included: saved?.included ?? false };
  });
}

const sourceTones = { ai: "text-ink-muted", edited: "font-semibold text-primary", low: "font-semibold text-warning-fg", manual: "text-ink-muted" };

// صف التحليل: جدول لما المكان يسمح، وكارت لما يبقى ضيق
const rowGrid =
  "grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 @min-[44rem]:grid-cols-[20px_140px_minmax(0,1fr)_52px_190px_40px]";

type DetailsEditorProps = { quote: QuoteDto; models: CurtainModelDto[]; materials: MaterialPublicDto[] };

/** الخطوة 2: مراجعة نتيجة التحليل والمقاسات (Quote-Details) */
export function DetailsEditor({ quote, models, materials }: DetailsEditorProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const uploader = usePhotoUpload();
  const names = useMemo(() => new Map(materials.map((m) => [m.id, m.name])), [materials]);

  const [modelId, setModelId] = useState(quote.modelId ?? "");
  const [operation, setOperation] = useState<Operation>(quote.operation);
  const [rows, setRows] = useState<Row[]>(() => initialRows(quote));
  const [optionalIds, setOptionalIds] = useState<string[]>(quote.optionalItemIds);
  const [useDefaultCornice, setUseDefaultCornice] = useState(quote.useDefaultCornice);
  const [widthCm, setWidthCm] = useState<number | null>(quote.widthCm);
  const [heightCm, setHeightCm] = useState<number | null>(quote.heightCm);
  const [windowCount, setWindowCount] = useState<number | null>(quote.windowCount);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const model = models.find((m) => m.id === modelId);
  const analyzed = quote.analysis?.status === "ok";
  const hasCorniceMaterials = materials.some((m) => fitsSlot(m, "cornice"));

  const updateRow = (slot: ComponentSlot, change: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.slot === slot ? { ...row, ...change } : row)));

  const resetToAi = () => {
    setRows(
      componentSlots.map((slot) => {
        const ai = quote.components.find((c) => c.slot === slot);
        return { slot, materialId: ai?.aiMaterialId ?? null, included: ai?.aiIncluded ?? false };
      }),
    );
    if (quote.aiModelId) setModelId(quote.aiModelId);
  };

  const optionalItems = (model?.items ?? []).filter((item) => !item.isRequired && (item.kind === "accessory" || operation === "motorized"));
  const requiredAccessories = (model?.items ?? []).filter((item) => item.isRequired && item.kind === "accessory");

  const submit = async () => {
    setSaving(true);
    setErrors({});
    setFormError(undefined);
    const result = await saveQuoteDetails(quote.id, {
      modelId: modelId || undefined,
      operation,
      widthCm,
      heightCm,
      windowCount,
      roomLabel: quote.roomLabel,
      components: rows.map((row) => ({ ...row, included: row.included && row.materialId !== null })),
      optionalItemIds: optionalIds.filter((id) => optionalItems.some((item) => item.id === id)),
      useDefaultCornice: !hasCorniceMaterials && useDefaultCornice,
    });
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      setFormError(result.message);
      setSaving(false);
      return;
    }
    router.push(`/quotes/${quote.id}/pricing`);
  };

  const changePhoto = async (files: File[]) => {
    if (await uploader.upload(quote.id, files.slice(0, 1))) router.push(`/quotes/${quote.id}/analyzing?retry=1`);
  };

  const modelSource = componentSource(
    { source: quote.aiModelId === modelId ? "ai" : "manual", confidence: quote.modelConfidence, aiMaterialId: quote.aiModelId, materialId: modelId },
    (id) => models.find((m) => m.id === id)?.name,
  );

  return (
    <div className="flex grow flex-col gap-4 lg:gap-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          <section aria-label="نتيجة تحليل الصورة" className="@container overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="flex flex-col">
                <h2 className="m-0 text-lg font-bold text-ink">{analyzed ? "نتيجة تحليل الصورة" : "تفاصيل الستارة"}</h2>
                <span className="text-xs text-ink-muted">كل بند قابل للتعديل من القائمة، والسعر بيتحسب في الخطوة الجاية</span>
              </div>
              {analyzed && (
                <Button variant="ghost" size="sm" onClick={resetToAi}>
                  رجّع اقتراح الذكاء الاصطناعي
                  <RotateCcw aria-hidden />
                </Button>
              )}
            </div>

            <div className={cn(rowGrid, "hidden border-y border-border bg-surface-subtle px-3 py-2 text-xs font-medium text-ink-muted @min-[44rem]:grid")}>
              <span />
              <span>البند</span>
              <span>الاختيار</span>
              <span>الثقة</span>
              <span>المصدر</span>
              <span />
            </div>

            {/* الموديل */}
            <div className={cn(rowGrid, "border-b border-border px-3 py-2")}>
              <span />
              <span className="flex items-center gap-2 font-medium text-ink">
                <Sparkles aria-hidden className="size-4.5 text-ink-muted" />
                الموديل
              </span>
              <span className="col-span-3 row-start-2 @min-[44rem]:col-span-1 @min-[44rem]:row-start-auto">
                <Select
                  aria-label="الموديل"
                  value={modelId}
                  aria-invalid={errors.modelId ? true : undefined}
                  onChange={(event) => {
                    const next = models.find((m) => m.id === event.target.value);
                    setModelId(event.target.value);
                    if (next) setOperation(next.operation);
                  }}
                  className="h-9"
                >
                  <option value="">اختار الموديل…</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
                {errors.modelId && <span className="text-xs text-danger-fg">{errors.modelId}</span>}
              </span>
              <span className="justify-self-end @min-[44rem]:justify-self-auto">
                {quote.modelConfidence !== null && quote.aiModelId === modelId ? <ConfidenceBadge value={quote.modelConfidence} /> : null}
              </span>
              <span className={cn("hidden text-xs @min-[44rem]:inline", sourceTones[modelSource.tone])}>{quote.aiModelId ? modelSource.text : "اختيار يدوي"}</span>
              <span className="hidden @min-[44rem]:block" />
            </div>

            {rows.map((row) => {
              const Icon = slotIcons[row.slot];
              const label = componentSlotLabels[row.slot];
              const saved = quote.components.find((c) => c.slot === row.slot);
              const options = materials.filter((m) => fitsSlot(m, row.slot));
              const matchesAi = saved?.aiMaterialId === row.materialId && saved?.aiIncluded === row.included;
              const source = componentSource(
                { source: matchesAi ? "ai" : "manual", confidence: saved?.confidence ?? null, aiMaterialId: saved?.aiMaterialId ?? null, materialId: row.materialId },
                (id) => names.get(id),
              );
              const corniceFallback = row.slot === "cornice" && !hasCorniceMaterials;
              const included = corniceFallback ? useDefaultCornice : row.included;
              return (
                <div key={row.slot} className={cn(rowGrid, "border-b border-border px-3 py-2 last:border-b-0", included ? (source.tone === "edited" ? "bg-primary-soft" : "") : "opacity-75")}>
                  <input
                    type="checkbox"
                    aria-label={`تضمين ${label}`}
                    checked={included}
                    disabled={!corniceFallback && !row.materialId}
                    onChange={(event) => (corniceFallback ? setUseDefaultCornice(event.target.checked) : updateRow(row.slot, { included: event.target.checked }))}
                    className="size-4.5 accent-primary"
                  />
                  <span className="flex items-center gap-2 font-medium text-ink">
                    <Icon aria-hidden className="size-4.5 text-ink-muted" />
                    {label}
                  </span>
                  <span className="col-span-3 row-start-2 @min-[44rem]:col-span-1 @min-[44rem]:row-start-auto">
                    {corniceFallback ? (
                      <span className="text-sm text-ink-2">كرنيشة بسعر المتر من الإعدادات</span>
                    ) : (
                      <Select
                        aria-label={label}
                        value={row.materialId ?? ""}
                        onChange={(event) => updateRow(row.slot, { materialId: event.target.value || null, included: event.target.value !== "" })}
                        className="h-9"
                      >
                        <option value="">{options.length ? "اختار…" : "مفيش خامات في الكتالوج"}</option>
                        {options.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} · {tierLabels[m.tier]} · {formatCurrency(m.sellPrice)}
                          </option>
                        ))}
                      </Select>
                    )}
                  </span>
                  <span className="justify-self-end @min-[44rem]:justify-self-auto">
                    {saved?.confidence !== null && saved?.confidence !== undefined && <ConfidenceBadge value={saved.confidence} />}
                  </span>
                  <span className={cn("col-span-2 text-xs @min-[44rem]:col-span-1", sourceTones[source.tone])}>
                    {source.tone === "low" && <TriangleAlert aria-hidden className="me-1 inline size-3.5 text-warning" />}
                    {included ? source.text : "مش في العرض"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label={`شيل ${label}`}
                    disabled={!included}
                    onClick={() => (corniceFallback ? setUseDefaultCornice(false) : updateRow(row.slot, { included: false }))}
                    className="justify-self-end"
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              );
            })}
          </section>

          {model && (
            <section aria-label="التشغيل والإكسسوارات" className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-card md:flex-row md:items-start md:gap-10">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-ink">التشغيل</span>
                <FilterChips
                  label="التشغيل"
                  value={operation}
                  onValueChange={setOperation}
                  options={(["manual", "motorized"] as const).map((value) => ({ value, label: operationLabels[value] }))}
                />
              </div>
              {(requiredAccessories.length > 0 || optionalItems.length > 0) && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-ink">إكسسوارات الموديل</span>
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {requiredAccessories.map((item) => (
                      <label key={item.id} className="inline-flex min-h-11 items-center gap-2 text-ink-2">
                        <input type="checkbox" checked disabled className="size-4.5 accent-primary" />
                        {item.label} (أساسي)
                      </label>
                    ))}
                    {optionalItems.map((item) => (
                      <label key={item.id} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-ink-2">
                        <input
                          type="checkbox"
                          checked={optionalIds.includes(item.id)}
                          onChange={(event) =>
                            setOptionalIds((current) => (event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id)))
                          }
                          className="size-4.5 accent-primary"
                        />
                        {item.label} · {formatCurrency(item.price)}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
          {model?.technicianNote && <InfoNote tone="warning">{model.technicianNote}</InfoNote>}
        </div>

        <section aria-label="الصورة والمقاسات" className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-card">
          <QuotePhoto quoteId={quote.id} photoCount={quote.photoCount} />
          {analyzed ? (
            <InfoNote tone="success">تم تحليل الصورة بنجاح</InfoNote>
          ) : quote.photoCount > 0 ? (
            <InfoNote>اختار الموديل والخامات بنفسك، والسعر هيتحسب من كتالوج محلك.</InfoNote>
          ) : null}
          {quote.analysis?.notes && <p className="m-0 text-sm text-ink-2">ملاحظة التحليل: {quote.analysis.notes}</p>}
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="العرض (سم)" value={widthCm} onValueChange={setWidthCm} min={20} step={10} error={errors.widthCm} />
            <NumberField label="الارتفاع (سم)" value={heightCm} onValueChange={setHeightCm} min={20} step={10} error={errors.heightCm} />
          </div>
          <NumberField label="عدد الشبابيك بنفس المقاس" value={windowCount} onValueChange={setWindowCount} min={1} max={50} error={errors.windowCount} />
          <Button variant="secondary" block disabled={uploader.busy} onClick={() => fileRef.current?.click()}>
            {uploader.progress ?? (quote.photoCount > 0 ? "تغيير الصورة وإعادة التحليل" : "إضافة صورة وتحليلها")}
            <RefreshCw aria-hidden />
          </Button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void changePhoto(Array.from(e.target.files ?? []))} />
          <FormError message={uploader.error ?? undefined} />
        </section>
      </div>

      <FormError message={Object.keys(errors).length > 0 ? undefined : formError} />
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <Button size="lg" onClick={() => void submit()} disabled={saving} className="min-w-40">
          {saving ? "بنحسب..." : "احسب السعر"}
          <Calculator aria-hidden />
        </Button>
        <Link href={quote.photoCount > 0 ? `/quotes/${quote.id}/analyzing` : "/"} className={buttonStyles({ variant: "secondary" })}>
          رجوع
        </Link>
      </div>
    </div>
  );
}
