import type { UserDto } from "@sijaf/shared";
import {
  CalendarDays,
  ChartColumn,
  FileText,
  House,
  Settings,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** مين يشوف اللينك */
  access: "all" | "quoters" | "owner";
};

/** القايمة الأساسية بالترتيب اللي في التصميم */
export const primaryNav: readonly NavItem[] = [
  { href: "/", label: "الرئيسية", icon: House, access: "all" },
  { href: "/quotes", label: "عروض الأسعار", icon: FileText, access: "quoters" },
  { href: "/clients", label: "العملاء", icon: Users, access: "all" },
  { href: "/schedule", label: "المواعيد", icon: CalendarDays, access: "all" },
  { href: "/catalog", label: "كتالوج الأسعار", icon: Tag, access: "owner" },
  { href: "/reports", label: "التقارير", icon: ChartColumn, access: "owner" },
];

export const secondaryNav: readonly NavItem[] = [
  { href: "/settings", label: "إعدادات المحل", icon: Settings, access: "owner" },
];

export function canSee(item: NavItem, user: Pick<UserDto, "role" | "canQuote">): boolean {
  if (item.access === "owner") return user.role === "owner";
  if (item.access === "quoters") return user.canQuote;
  return true;
}

export function visibleNav(items: readonly NavItem[], user: Pick<UserDto, "role" | "canQuote">): NavItem[] {
  return items.filter((item) => canSee(item, user));
}

/** الرئيسية بتتعلّم بس على "/"؛ الباقي على المسار وكل اللي تحته */
export function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
