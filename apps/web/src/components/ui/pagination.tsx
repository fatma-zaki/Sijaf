import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, buttonStyles } from "./button";

type PaginationProps = {
  /** «عرض 12 من 25 خامة» */
  summary: string;
  previousHref?: string;
  nextHref?: string;
  className?: string;
};

export function Pagination({ summary, previousHref, nextHref, className }: PaginationProps) {
  const style = buttonStyles({ variant: "secondary", size: "sm" });
  const previous = (
    <>
      <ChevronRight aria-hidden />
      السابق
    </>
  );
  const next = (
    <>
      التالي
      <ChevronLeft aria-hidden />
    </>
  );

  return (
    <nav aria-label="الصفحات" className={cn("flex items-center justify-between gap-3 px-4 py-3", className)}>
      <span className="text-sm text-ink-muted">{summary}</span>
      <div className="flex gap-2">
        {previousHref ? (
          <Link href={previousHref} className={style}>
            {previous}
          </Link>
        ) : (
          <Button variant="secondary" size="sm" disabled>
            {previous}
          </Button>
        )}
        {nextHref ? (
          <Link href={nextHref} className={style}>
            {next}
          </Link>
        ) : (
          <Button variant="secondary" size="sm" disabled>
            {next}
          </Button>
        )}
      </div>
    </nav>
  );
}
