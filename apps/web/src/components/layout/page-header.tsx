import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { UserMenu } from "./user-menu";

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** أزرار جنب العنوان (عرض سعر جديد، إضافة…) */
  actions?: ReactNode;
  /** على الموبايل بيظهر سهم رجوع (زي صفحات «المزيد») */
  backHref?: string;
};

/** رأس الصفحة: العنوان والأزرار، وعلى التابلت واللابتوب قايمة الحساب */
export function PageHeader({ title, subtitle, actions, backHref }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 md:gap-4">
      <div className="flex min-w-0 items-center gap-2">
        {backHref && (
          <Link
            href={backHref}
            aria-label="رجوع"
            className="grid size-11 flex-none place-items-center rounded-sm text-ink hover:bg-surface md:hidden"
          >
            <ChevronRight aria-hidden className="size-5.5" />
          </Link>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="m-0 text-title font-bold text-ink lg:text-4xl">{title}</h1>
          {subtitle && <p className="m-0 text-sm text-ink-muted md:text-base">{subtitle}</p>}
        </div>
      </div>
      <div className="flex flex-none items-center gap-2 md:gap-3">
        {actions}
        <div className="hidden md:block">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
