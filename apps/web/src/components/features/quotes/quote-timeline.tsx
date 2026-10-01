import type { QuoteEventDto } from "@sijaf/shared";
import { CalendarCheck, Check, CircleX, Download, Eye, FilePlus2, PencilLine, RefreshCw, Send, Sparkles, Tag, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRelativeDateTime } from "@/lib/format";
import { describeEvents, type TimelineIcon, type TimelineTone } from "./quote-events";

const icons: Record<TimelineIcon, LucideIcon> = {
  created: FilePlus2,
  ai: Sparkles,
  edit: PencilLine,
  priced: Tag,
  sent: Send,
  opened: Eye,
  accepted: Check,
  rejected: CircleX,
  status: RefreshCw,
  pdf: Download,
  appointment: CalendarCheck,
};

const tones: Record<TimelineTone, string> = {
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  neutral: "bg-surface-subtle text-ink-2",
};

/** «سجل العرض»: من الأحدث للأقدم، بخط بيوصل الأيقونات */
export function QuoteTimeline({ events, compact = false }: { events: readonly QuoteEventDto[]; compact?: boolean }) {
  const entries = describeEvents(events);
  if (entries.length === 0) return <p className="m-0 text-sm text-ink-muted">لسه مفيش حاجة في السجل.</p>;

  return (
    <ol className="m-0 flex list-none flex-col p-0">
      {entries.map((entry, index) => {
        const Icon = icons[entry.icon];
        const meta = [formatRelativeDateTime(new Date(entry.createdAt)), ...(compact ? [] : entry.details)].join(" · ");
        return (
          <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
            {index < entries.length - 1 && <span aria-hidden className="absolute start-4 top-8 bottom-0 w-px -translate-x-1/2 rtl:translate-x-1/2 bg-border" />}
            <span className={cn("grid size-8 flex-none place-items-center rounded-pill border border-border [&_svg]:size-4", tones[entry.tone])}>
              <Icon aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5 pt-1">
              <span className="text-sm font-semibold text-ink">{entry.title}</span>
              <span className="text-xs text-ink-muted">{meta}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
