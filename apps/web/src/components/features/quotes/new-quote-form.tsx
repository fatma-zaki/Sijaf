"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  MAX_QUOTE_PHOTOS,
  createQuoteSchema,
  roomLabels,
  type CreateQuoteData,
  type CreateQuoteInput,
} from "@sijaf/shared";
import { Camera, ChevronLeft, CircleCheck, Images, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { InfoNote } from "@/components/ui/info-note";
import { UploadDrop } from "@/components/ui/upload-drop";
import { applyActionErrors } from "@/lib/forms";
import { createQuote } from "./actions";
import { usePhotoUpload } from "./use-photo-upload";

const analyzedThings = ["نوع القماش", "عدد الطبقات", "نوع الكرنيشة", "شكل الستارة", "الإكسسوارات"];

/** الخطوة 1: بيانات العميل وصورة الستارة (Quote-Upload) */
export function NewQuoteForm() {
  const router = useRouter();
  const roomsId = useId();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  // العرض بيتعمل مرة واحدة؛ لو الرفع فشل بنعيد الرفع بس من غير عرض جديد
  const [createdId, setCreatedId] = useState<string | null>(null);
  const uploader = usePhotoUpload();

  const previews = useMemo(() => photos.map((file) => URL.createObjectURL(file)), [photos]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const form = useForm<CreateQuoteInput, unknown, CreateQuoteData>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: { clientName: "", clientPhone: "", area: "", roomLabel: "" },
  });
  const { errors, isSubmitting } = form.formState;

  // مافيش فلترة بالنوع: HEIC أحيانًا بييجي من غير type، والضغط بيقول لو المتصفح مش قادر يقراه
  const addPhotos = (files: readonly File[]) => setPhotos((current) => [...current, ...files].slice(0, MAX_QUOTE_PHOTOS));

  const onSubmit = form.handleSubmit(async (data) => {
    let id = createdId;
    if (!id) {
      const result = await createQuote(data);
      if (applyActionErrors(result, form.setError, ["clientName", "clientPhone", "area"])) return;
      if (!result.ok) return;
      id = result.data.id;
      setCreatedId(id);
    }
    if (photos.length === 0) return router.push(`/quotes/${id}/details`);
    if (await uploader.upload(id, photos)) router.push(`/quotes/${id}/analyzing`);
  });

  const busy = isSubmitting || uploader.busy;
  const invalid = (name: keyof CreateQuoteInput) => (errors[name] ? true : undefined);

  return (
    <form noValidate onSubmit={onSubmit} className="flex grow flex-col gap-4 lg:gap-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-6">
        <div className="flex flex-col gap-4 lg:gap-6">
          <Card className="flex flex-col gap-3.5">
            <CardTitle>بيانات العميل</CardTitle>
            <FormError message={errors.root?.server?.message} />
            <Field label="اسم العميل" error={errors.clientName?.message}>
              <Input placeholder="مثال: أحمد محمد" aria-invalid={invalid("clientName")} {...form.register("clientName")} />
            </Field>
            <Field label="رقم الموبايل (واتساب)" error={errors.clientPhone?.message}>
              <Input type="tel" dir="ltr" inputMode="tel" placeholder="01xxxxxxxxx" className="text-end" aria-invalid={invalid("clientPhone")} {...form.register("clientPhone")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="المنطقة">
                <Input placeholder="مثال: مدينة نصر" {...form.register("area")} />
              </Field>
              <Field label="المكان">
                <Input list={roomsId} placeholder="غرفة نوم" {...form.register("roomLabel")} />
              </Field>
            </div>
            <datalist id={roomsId}>
              {roomLabels.map((room) => (
                <option key={room} value={room} />
              ))}
            </datalist>
          </Card>

          <Card className="hidden flex-col gap-3.5 lg:flex">
            <CardTitle className="text-md">ماذا سيحلل الذكاء الاصطناعي؟</CardTitle>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {analyzedThings.map((thing) => (
                <li key={thing} className="flex items-center gap-2.5 text-ink-2">
                  <CircleCheck aria-hidden className="size-4.5 text-primary" />
                  {thing}
                </li>
              ))}
            </ul>
            <InfoNote>كل هذه المعلومات سيتم تحديدها تلقائياً، ويمكنك مراجعتها وتعديلها لاحقاً. السعر يُحسب من كتالوج محلك.</InfoNote>
          </Card>
        </div>

        <Card className="flex flex-col gap-4">
          <CardTitle>صورة الستارة</CardTitle>
          {/* الموبايل: الكاميرا مباشرة */}
          <div className="flex flex-col gap-3 md:hidden">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-[1.5px] border-dashed border-primary bg-primary-soft px-4 py-8 text-primary"
            >
              <Camera aria-hidden className="size-10" />
              <span className="text-lg font-bold">صوّر الستارة</span>
              <span className="text-xs text-ink-2">الشباك كله من الأرض للسقف</span>
            </button>
            <Button variant="secondary" size="lg" onClick={() => galleryRef.current?.click()}>
              اختار من الصور
              <Images aria-hidden />
            </Button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => addPhotos(Array.from(e.target.files ?? []))} />
            <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(Array.from(e.target.files ?? []))} />
          </div>
          <UploadDrop
            className="hidden grow md:flex md:justify-center"
            title="اسحب صورة الستارة هنا"
            buttonLabel="رفع صورة"
            hint={`يمكنك رفع أكثر من صورة (لحد ${MAX_QUOTE_PHOTOS}) • JPG / PNG`}
            accept="image/*"
            multiple
            onFiles={addPhotos}
          />
          {photos.length > 0 && (
            <ul aria-label="الصور المختارة" className="m-0 grid list-none grid-cols-4 gap-2 p-0">
              {photos.map((file, index) => (
                <li key={previews[index]} className="relative aspect-square overflow-hidden rounded-md border border-border">
                  {/* معاينة محلية (blob:)؛ next/image مالوش لازمة هنا */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previews[index]} alt={`صورة ${index + 1}`} className="size-full object-cover" />
                  <button
                    type="button"
                    aria-label={`شيل الصورة ${index + 1}`}
                    onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}
                    className="touch-target absolute end-1 top-1 grid size-6 cursor-pointer place-items-center rounded-pill bg-pine-900/70 text-on-pine"
                  >
                    <X aria-hidden className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="m-0 flex items-center gap-2 text-xs text-ink-muted">
            <MessageCircle aria-hidden className="size-4" />
            أو استلم الصورة من العميل على واتساب وارفعها من هنا
          </p>
        </Card>
      </div>

      <FormError message={uploader.error ?? undefined} />
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <Button type="submit" size="lg" disabled={busy} className="min-w-40">
          {uploader.progress ?? (isSubmitting ? "لحظة..." : photos.length > 0 ? "متابعة" : "كمّل من غير صورة")}
          <ChevronLeft aria-hidden />
        </Button>
        <Link href="/" className={buttonStyles({ variant: "secondary" })}>
          إلغاء
        </Link>
      </div>
    </form>
  );
}
