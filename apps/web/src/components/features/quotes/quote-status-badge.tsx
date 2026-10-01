import { quoteStatusLabels, type QuoteStatus } from "@sijaf/shared";
import { CircleCheck, CircleX, Clock, Send } from "lucide-react";
import type { ReactNode } from "react";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";

const looks: Record<QuoteStatus, { tone: BadgeTone; icon?: ReactNode }> = {
  draft: { tone: "neutral" },
  review: { tone: "warning", icon: <Clock aria-hidden /> },
  sent: { tone: "info", icon: <Send aria-hidden /> },
  accepted: { tone: "success", icon: <CircleCheck aria-hidden /> },
  rejected: { tone: "neutral", icon: <CircleX aria-hidden /> },
};

export function QuoteStatusBadge({ status, className }: { status: QuoteStatus; className?: string }) {
  const { tone, icon } = looks[status];
  return (
    <StatusBadge tone={tone} icon={icon} className={className}>
      {quoteStatusLabels[status]}
    </StatusBadge>
  );
}
