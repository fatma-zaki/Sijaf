import Link from "next/link";
import { cn } from "@/lib/cn";

export type TabNavItem = {
  href: string;
  label: string;
  count?: number;
  current: boolean;
};

type TabNavProps = {
  label: string;
  items: readonly TabNavItem[];
  className?: string;
};

/** تبويبات بلينكات (زي أقسام الكتالوج)، كل تبويب صفحة */
export function TabNav({ label, items, className }: TabNavProps) {
  return (
    <nav aria-label={label} className={cn("flex gap-7 overflow-x-auto border-b border-border", className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.current ? "page" : undefined}
          className={cn(
            "-mb-px inline-flex h-11 flex-none items-center gap-2 border-b-2 px-1 text-md no-underline",
            item.current
              ? "border-primary font-bold text-primary hover:text-primary"
              : "border-transparent font-medium text-ink-muted hover:text-ink",
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span
              className={cn(
                "rounded-pill px-2 text-xs font-semibold",
                item.current ? "bg-primary-soft" : "bg-surface-subtle",
              )}
            >
              {item.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
