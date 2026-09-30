import type { UserDto } from "@sijaf/shared";
import { CalendarDays, Camera, FileText, House, Menu, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { NavLink } from "./nav-link";

type TabProps = { href: string; label: string; icon: LucideIcon };

function Tab({ href, label, icon: Icon }: TabProps) {
  return (
    <NavLink
      href={href}
      className="flex min-h-13 flex-1 flex-col items-center justify-center gap-0.5 text-2xs font-medium text-ink-muted no-underline hover:text-ink aria-[current=page]:font-semibold aria-[current=page]:text-primary"
    >
      <Icon aria-hidden className="size-5.5" />
      <span>{label}</span>
    </NavLink>
  );
}

/** التنقل تحت: موبايل (أقل من 600) */
export function BottomNav({ user }: { user: UserDto }) {
  return (
    <nav
      aria-label="التنقل"
      className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-1 border-t border-border bg-surface px-3 pb-[max(18px,env(safe-area-inset-bottom))] pt-1.5 md:hidden"
    >
      <Tab href="/" label="الرئيسية" icon={House} />
      {user.canQuote && <Tab href="/quotes" label="العروض" icon={FileText} />}
      {user.canQuote && (
        <Link
          href="/quotes/new"
          aria-label="عرض سعر جديد"
          className="-mt-5 grid size-14 flex-none place-items-center rounded-pill bg-primary text-on-primary shadow-raised hover:bg-primary-hover hover:text-on-primary"
        >
          <Camera aria-hidden className="size-6" />
        </Link>
      )}
      <Tab href="/schedule" label="المواعيد" icon={CalendarDays} />
      <Tab href="/more" label="المزيد" icon={Menu} />
    </nav>
  );
}
