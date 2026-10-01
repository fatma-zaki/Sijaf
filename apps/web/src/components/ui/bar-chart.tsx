import { cn } from "@/lib/cn";

export type BarDatum = { label: string; value: number };

type BarChartProps = {
  data: readonly BarDatum[];
  /** الوصف اللي قارئ الشاشة بيقراه قبل الأرقام: «عدد العروض» */
  label: string;
  /** وحدة الـ tooltip: «عرض» */
  unit?: string;
  className?: string;
};

/** أعمدة رأسية بسيطة؛ آخر عمود (الفترة الحالية) لونه أغمق */
export function BarChart({ data, label, unit = "", className }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const description = `${label}: ${data.map((d) => `${d.label} ${d.value}`).join("، ")}`;
  return (
    <div role="img" aria-label={description} className={cn("flex h-48 items-end gap-3 md:gap-5", className)}>
      {data.map((d, index) => (
        <div key={d.label} title={`${d.label}: ${d.value} ${unit}`.trim()} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1.5">
          <div aria-hidden className="flex w-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs font-semibold text-ink-2">{d.value}</span>
            {/* الارتفاع قيمة متغيرة، فلازم style؛ 85% عشان الرقم فوقه يفضل جوه */}
            <span
              className={cn("w-full max-w-12 rounded-t-sm", index === data.length - 1 ? "bg-primary" : "bg-primary-soft")}
              style={{ height: `${Math.max(2, (d.value / max) * 85)}%` }}
            />
          </div>
          <span aria-hidden className="w-full truncate text-center text-xs text-ink-muted">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}
