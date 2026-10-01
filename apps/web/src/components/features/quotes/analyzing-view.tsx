"use client";

import type { AnalysisStatus, QuoteDto } from "@sijaf/shared";
import { Camera, ChevronLeft, CircleCheck, Lightbulb, LoaderCircle, Circle, ScanSearch, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import { analyzeQuote } from "./actions";
import { QuotePhoto } from "./quote-photo";
import { usePhotoUpload } from "./use-photo-upload";

const progressSteps = ["بنتعرف على الموديل", "بنحدد الطبقات (شيفون، قماش، بطانة)", "بنطابق الخامات مع كتالوج محلك", "بنحدد المجرى والكرنيشة"];
const STEP_MS = 5000;

type Problem = Exclude<AnalysisStatus, "ok" | "skipped">;

const problems: Record<Problem, { title: string; description: string; tips: boolean; retry: boolean }> = {
  unclear: {
    title: "الصورة مش واضحة كفاية",
    description: "مش قادرين نحدد الموديل والخامات من الصورة دي. ممكن تصوّر تاني، أو تكمّل وتختار التفاصيل بنفسك.",
    tips: true,
    retry: false,
  },
  not_curtain: {
    title: "الصورة دي مش لستارة",
    description: "مش لاقيين ستارة أو شباك في الصورة. اتأكد إنك رفعت الصورة الصح، أو كمّل وأدخل التفاصيل يدوي.",
    tips: true,
    retry: false,
  },
  failed: {
    title: "التحليل ماكملش",
    description: "حصلت مشكلة وإحنا بنحلل الصورة. جرّب تاني بعد ثواني، أو كمّل وأدخل التفاصيل يدوي.",
    tips: false,
    retry: true,
  },
  unavailable: {
    title: "التحليل التلقائي مش متاح دلوقتي",
    description: "مش هنقدر نحلل الصورة دلوقتي، بس تقدر تكمّل وتختار الموديل والخامات بنفسك والسعر هيتحسب عادي.",
    tips: false,
    retry: false,
  },
};

const tips = ["صوّر الشباك كله من الأرض للسقف", "خلي الإضاءة كويسة ومن غير فلاش", "لو الصورة من العميل، اطلب منه صورة أوضح"];

type AnalyzingViewProps = { quote: QuoteDto; /** حالة تحليل سابق لو موجود */ initialStatus: AnalysisStatus | null };

/** «بنحلل صورة الستارة» وبعدها: للتفاصيل، أو شاشة مشكلة الصورة (Quote-Analyzing / Quote-Error) */
export function AnalyzingView({ quote, initialStatus }: AnalyzingViewProps) {
  const router = useRouter();
  const detailsHref = `/quotes/${quote.id}/details`;
  const [status, setStatus] = useState<AnalysisStatus | "running">(initialStatus && initialStatus !== "ok" ? initialStatus : "running");
  const [photoCount, setPhotoCount] = useState(quote.photoCount);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploader = usePhotoUpload();

  const run = useCallback(async () => {
    setStatus("running");
    setElapsed(0);
    setError(null);
    const result = await analyzeQuote(quote.id);
    if (!result.ok) {
      setStatus("failed");
      setError(result.message);
      return;
    }
    if (result.data.status === "ok" || result.data.status === "skipped") {
      router.replace(detailsHref);
      return;
    }
    setStatus(result.data.status);
  }, [quote.id, detailsHref, router]);

  // التحليل بيبدأ لوحده مرة واحدة (React بيشغّل الـ effect مرتين في التطوير)
  useEffect(() => {
    if (started.current || status !== "running") return;
    started.current = true;
    void run();
  }, [run, status]);

  useEffect(() => {
    if (status !== "running") return;
    const timer = setInterval(() => setElapsed((value) => value + 1), STEP_MS);
    return () => clearInterval(timer);
  }, [status]);

  const retake = async (files: File[]) => {
    if (await uploader.upload(quote.id, files.slice(0, 1))) {
      setPhotoCount((count) => count + 1);
      void run();
    }
  };

  const running = status === "running";
  const problem = running ? null : problems[status as Problem];

  return (
    <section
      aria-live="polite"
      className="flex grow flex-col gap-6 rounded-lg border border-border bg-surface p-5 shadow-card md:flex-row md:items-center md:gap-12 md:p-10"
    >
      <div className="relative w-full flex-none md:w-90">
        <QuotePhoto
          quoteId={quote.id}
          photoCount={photoCount}
          className={cn("aspect-[9/11] border-2", running ? "border-primary" : "border-warning")}
          badge={
            running ? (
              <StatusBadge tone="info" icon={<ScanSearch aria-hidden />}>
                بيحلل...
              </StatusBadge>
            ) : undefined
          }
        />
      </div>

      {running ? (
        <div className="flex max-w-140 grow flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="m-0 text-title font-bold text-ink">بنحلل صورة الستارة</h2>
            <p className="m-0 text-ink-muted">ده بياخد من 10 لـ 30 ثانية. تقدر تراجع وتعدّل كل حاجة بعدها.</p>
          </div>
          <ProgressBar label="تقدم التحليل" value={Math.min(90, 15 + elapsed * 18)} />
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {progressSteps.map((step, index) => {
              const done = index < elapsed;
              const current = index === Math.min(elapsed, progressSteps.length - 1) && !done;
              return (
                <li key={step} className={cn("flex items-center gap-3 text-md", done || current ? "text-ink" : "text-ink-muted", current && "font-semibold")}>
                  {done ? (
                    <CircleCheck aria-hidden className="size-5 text-success" />
                  ) : current ? (
                    <LoaderCircle aria-hidden className="size-5 animate-spin text-primary" />
                  ) : (
                    <Circle aria-hidden className="size-5 text-border-strong" />
                  )}
                  {current ? `${step}...` : step}
                </li>
              );
            })}
          </ul>
          <div className="pt-2">
            <Link href={detailsHref} className={buttonStyles({ variant: "secondary" })}>
              إلغاء وإدخال يدوي
            </Link>
          </div>
        </div>
      ) : (
        problem && (
          <div className="flex max-w-145 grow flex-col gap-5">
            <span className="grid size-14 place-items-center rounded-pill bg-warning-soft text-warning">
              <TriangleAlert aria-hidden className="size-7" />
            </span>
            <div className="flex flex-col gap-1.5">
              <h2 className="m-0 text-title font-bold text-ink">{problem.title}</h2>
              <p className="m-0 text-md text-ink-2">{problem.description}</p>
            </div>
            {problem.tips && (
              <ul className="m-0 flex list-none flex-col gap-2.5 rounded-md bg-surface-info px-5 py-4">
                {tips.map((tip) => (
                  <li key={tip} className="flex items-center gap-2.5">
                    <Lightbulb aria-hidden className="size-4.5 text-primary" />
                    {tip}
                  </li>
                ))}
              </ul>
            )}
            <FormError message={uploader.error ?? error ?? undefined} />
            <div className="flex flex-wrap gap-3">
              {problem.retry ? (
                <Button size="lg" onClick={() => void run()}>
                  جرّب التحليل تاني
                </Button>
              ) : (
                status !== "unavailable" && (
                  <Button size="lg" disabled={uploader.busy} onClick={() => fileRef.current?.click()}>
                    {uploader.progress ?? "صوّر تاني أو ارفع صورة"}
                    <Camera aria-hidden />
                  </Button>
                )
              )}
              <Link href={detailsHref} className={buttonStyles({ variant: status === "unavailable" ? "primary" : "secondary", size: "lg" })}>
                كمّل وأدخل التفاصيل يدوي
                {status === "unavailable" && <ChevronLeft aria-hidden />}
              </Link>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void retake(Array.from(e.target.files ?? []))} />
            {problem.tips && <p className="m-0 text-xs text-ink-muted">لو الصورة مش لستارة خالص، هنقولك كده برضه عشان ماتضيّعش وقت.</p>}
          </div>
        )
      )}
    </section>
  );
}
