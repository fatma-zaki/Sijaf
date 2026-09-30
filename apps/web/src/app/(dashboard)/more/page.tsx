import { CalendarDays, ChartColumn, ChevronLeft, Layers, LogOut, Settings, Tag, Truck, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/components/features/auth/actions";
import { canSee, type NavItem } from "@/components/layout/nav-items";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "المزيد" };

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "المحل",
    items: [
      { href: "/clients", label: "العملاء", icon: Users, access: "all" },
      { href: "/schedule", label: "المواعيد", icon: CalendarDays, access: "all" },
      { href: "/reports", label: "التقارير", icon: ChartColumn, access: "owner" },
    ],
  },
  {
    title: "الكتالوج",
    items: [
      { href: "/catalog/materials", label: "الخامات والأسعار", icon: Tag, access: "owner" },
      { href: "/catalog/suppliers", label: "الموردين", icon: Truck, access: "owner" },
      { href: "/catalog/models", label: "الموديلات", icon: Layers, access: "owner" },
    ],
  },
  {
    title: "الحساب",
    items: [{ href: "/settings", label: "إعدادات المحل", icon: Settings, access: "owner" }],
  },
];

/** قايمة «المزيد» على الموبايل (Menu-Mobile) */
export default async function MorePage() {
  const { user, shop } = await getSession();
  const roleLabel = user.role === "owner" ? "صاحب المحل" : user.jobTitle;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 pb-2 pt-1">
        <span className="grid size-12 place-items-center rounded-md bg-pine-900 font-bold text-on-pine" aria-hidden>
          {shop.name.slice(0, 2)}
        </span>
        <div className="flex flex-col">
          <h1 className="m-0 text-lg font-bold text-ink">{shop.name}</h1>
          <span className="text-xs text-ink-muted">
            {user.fullName} · {roleLabel}
          </span>
        </div>
      </div>

      {sections.map((section) => {
        const items = section.items.filter((item) => canSee(item, user));
        if (items.length === 0) return null;
        return (
          <section key={section.title} aria-label={section.title} className="flex flex-col gap-1.5">
            <h2 className="m-0 px-1 text-xs font-normal text-ink-muted">{section.title}</h2>
            <ul className="m-0 list-none overflow-hidden rounded-lg border border-border bg-surface p-0 shadow-card">
              {items.map(({ href, label, icon: Icon }) => (
                <li key={href} className="border-b border-border last:border-b-0">
                  <Link href={href} className="flex min-h-13 items-center gap-3 px-3.5 no-underline">
                    <Icon aria-hidden className="size-5 text-primary" />
                    <span className="grow text-md font-semibold text-ink">{label}</span>
                    <ChevronLeft aria-hidden className="size-4.5 text-ink-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <form action={logout} className="pt-2">
        <button
          type="submit"
          className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 font-semibold text-danger-fg"
        >
          <LogOut aria-hidden className="size-4" />
          تسجيل خروج
        </button>
      </form>
    </div>
  );
}
