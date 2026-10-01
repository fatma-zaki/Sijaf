import { ImageIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type QuotePhotoProps = {
  quoteId: string;
  photoCount: number;
  /** شارة فوق الصورة («بيحلل...»، «تم التحليل · 87%») */
  badge?: ReactNode;
  className?: string;
};

/** آخر صورة اترفعت للعرض (هي اللي اتحللت)، أو مكان فاضي */
export function QuotePhoto({ quoteId, photoCount, badge, className }: QuotePhotoProps) {
  return (
    <div className={cn("relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-surface-subtle", className)}>
      {photoCount > 0 ? (
        <Image
          src={`/api/quotes/${quoteId}/photos/${photoCount - 1}`}
          alt="صورة الستارة"
          fill
          // الصورة خاصة وبتعدّي من الـ API؛ مضغوطة بالفعل من المتصفح
          unoptimized
          className="object-cover"
          sizes="(min-width: 1025px) 40vw, 100vw"
        />
      ) : (
        <div className="grid h-full place-items-center text-ink-muted">
          <span className="flex flex-col items-center gap-2 text-sm">
            <ImageIcon aria-hidden className="size-8" />
            من غير صورة
          </span>
        </div>
      )}
      {badge && <span className="absolute end-3 top-3">{badge}</span>}
    </div>
  );
}
