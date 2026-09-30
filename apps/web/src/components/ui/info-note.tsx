import type { ReactNode } from "react";
import { CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type InfoNoteTone = "info" | "success" | "warning";

const tones: Record<InfoNoteTone, { box: string; icon: string; Icon: typeof Info }> = {
  info: { box: "items-start bg-surface-info text-xs leading-5 text-ink-2", icon: "mt-0.5 text-primary", Icon: Info },
  success: { box: "items-center bg-success-soft text-md font-bold text-success", icon: "text-success", Icon: CircleCheck },
  warning: {
    box: "items-center bg-warning-soft text-sm font-medium text-warning-fg",
    icon: "text-warning",
    Icon: TriangleAlert,
  },
};

type InfoNoteProps = {
  tone?: InfoNoteTone;
  className?: string;
  children: ReactNode;
};

export function InfoNote({ tone = "info", className, children }: InfoNoteProps) {
  const { box, icon, Icon } = tones[tone];
  return (
    <div role="note" className={cn("flex gap-2 rounded-md px-4 py-3", box, className)}>
      <Icon aria-hidden className={cn("size-4 shrink-0", icon)} />
      <div>{children}</div>
    </div>
  );
}
