import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  /** أزرار الإجراء */
  actions?: ReactNode;
  /** أي حاجة تحت الأزرار: تنبيه، مزايا، progress */
  children?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, actions, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex grow flex-col items-center justify-center gap-3.5 px-4 py-10 text-center md:p-10",
        className,
      )}
    >
      <span className="grid size-18 place-items-center rounded-pill bg-primary-soft text-primary [&_svg]:size-8">
        {icon}
      </span>
      <h2 className="m-0 text-2xl font-bold text-ink">{title}</h2>
      <p className="m-0 max-w-110 text-base leading-6 text-ink-2">{description}</p>
      {actions && <div className="flex flex-wrap justify-center gap-2.5 pt-1.5">{actions}</div>}
      {children && <div className="mt-4.5 w-full max-w-140">{children}</div>}
    </div>
  );
}
