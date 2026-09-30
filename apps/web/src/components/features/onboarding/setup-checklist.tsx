import type { ShopDto } from "@sijaf/shared";
import { Check, ChevronLeft, CircleCheck } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import { checklist, isStepDone } from "./steps";

/** «جهّز محلك» زي شاشة Main-Empty: الخطوة الحالية متلوّنة وعليها زرار */
export function SetupChecklist({ shop }: { shop: ShopDto }) {
  const doneCount = checklist.filter((item) => isStepDone(shop, item.id)).length;
  const current = checklist.find((item) => !isStepDone(shop, item.id));

  return (
    <Card className="flex flex-col gap-3 md:p-6">
      <CardHeader className="mb-0">
        <CardTitle>جهّز محلك</CardTitle>
        <span className="text-sm font-semibold text-ink-2">
          {doneCount} من {checklist.length}
        </span>
      </CardHeader>
      <ProgressBar label="تجهيز المحل" value={doneCount} max={checklist.length} className="mb-2" />
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {checklist.map((item, index) => {
          const done = isStepDone(shop, item.id);
          const isCurrent = item === current;
          return (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-3.5 rounded-md border px-4 py-3.5",
                isCurrent ? "border-primary bg-primary-soft" : "border-border",
              )}
            >
              <span
                className={cn(
                  "grid size-8 flex-none place-items-center rounded-pill border text-sm font-bold",
                  done || isCurrent
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border bg-surface-subtle text-ink-muted",
                )}
              >
                {done ? <Check aria-label="تمت" className="size-4" /> : index + 1}
              </span>
              <div className="flex min-w-0 grow flex-col">
                <span className={cn("text-md font-semibold", done ? "text-ink-muted line-through" : "text-ink")}>
                  {item.title}
                </span>
                <span className="text-xs text-ink-muted">{item.description}</span>
              </div>
              {done ? (
                <StatusBadge tone="success" icon={<CircleCheck aria-hidden />}>
                  تم
                </StatusBadge>
              ) : isCurrent ? (
                <Link href={item.href} className={buttonStyles({ size: "lg" })}>
                  ابدأ
                  <ChevronLeft aria-hidden />
                </Link>
              ) : (
                <Link href={item.href} className="inline-flex min-h-11 items-center text-sm font-semibold">
                  ابدأ
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
