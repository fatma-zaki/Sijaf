"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { shopLogoSrc } from "@/components/features/quotes/media";
import { Button } from "@/components/ui/button";
import { compressImage, ImageReadError } from "@/lib/image/compress";

const LOGO_SIDE = 512;

/** لوجو المحل: بيظهر في العرض وصفحة العميل والـ PDF */
export function ShopLogoField({ shopName, logoVersion }: { shopName: string; logoVersion: string | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const src = shopLogoSrc({ logoVersion });

  const send = (init: RequestInit) =>
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/shop/logo", init);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        return setError(body?.message ?? "معرفناش نحفظ اللوجو، جرّب تاني");
      }
      router.refresh();
    });

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const blob = await compressImage(file, { maxSide: LOGO_SIDE, type: "image/png" });
      const form = new FormData();
      form.append("logo", blob, "logo.png");
      send({ method: "POST", body: form });
    } catch (caught) {
      setError(caught instanceof ImageReadError ? caught.message : "معرفناش نقرا الصورة");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink-2">لوجو المحل</span>
      <div className="flex items-center gap-3">
        <span className="relative grid size-16 flex-none place-items-center overflow-hidden rounded-md border border-dashed border-border-strong bg-surface-subtle text-sm font-bold text-ink-muted">
          {src ? <Image src={src} alt={`شعار ${shopName}`} fill unoptimized className="object-contain p-1" /> : <span aria-hidden>{shopName.slice(0, 2)}</span>}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" className="h-11" disabled={pending} onClick={() => input.current?.click()}>
            {pending ? "بنحفظ..." : src ? "تغيير اللوجو" : "رفع لوجو"}
            <ImagePlus aria-hidden />
          </Button>
          {src && (
            <Button variant="danger-ghost" size="sm" className="h-11" disabled={pending} onClick={() => send({ method: "DELETE" })}>
              شيل اللوجو
              <Trash2 aria-hidden />
            </Button>
          )}
        </div>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={upload} />
      </div>
      {error ? (
        <span role="alert" className="text-xs text-danger-fg">
          {error}
        </span>
      ) : (
        <span className="text-xs text-ink-muted">بيظهر في عرض السعر والـ PDF اللي بيوصل للعميل.</span>
      )}
    </div>
  );
}
