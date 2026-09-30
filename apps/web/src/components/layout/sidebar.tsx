import type { UserDto } from "@sijaf/shared";
import { Logo } from "@/components/ui/logo";
import { primaryNav, secondaryNav, visibleNav, type NavItem } from "./nav-items";
import { NavLink } from "./nav-link";

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      href={item.href}
      className="flex h-10 items-center gap-3 rounded-sm px-3 text-base font-medium text-on-pine no-underline hover:bg-pine-800 hover:text-on-pine aria-[current=page]:bg-pine-700 aria-[current=page]:font-semibold"
    >
      <Icon aria-hidden className="size-4.5 flex-none" />
      {item.label}
    </NavLink>
  );
}

/** القايمة الجانبية الكاملة: لابتوب (أكبر من 1024) */
export function Sidebar({ user }: { user: UserDto }) {
  const secondary = visibleNav(secondaryNav, user);
  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="sticky top-0 hidden h-dvh w-sidebar flex-none flex-col gap-1 overflow-y-auto bg-pine-900 px-3 py-5 text-on-pine lg:flex"
    >
      <div className="px-3 pb-5">
        <Logo />
      </div>
      {visibleNav(primaryNav, user).map((item) => (
        <SidebarLink key={item.href} item={item} />
      ))}
      {secondary.length > 0 && (
        <>
          <div role="separator" className="mx-3 my-4 h-px bg-pine-800" />
          {secondary.map((item) => (
            <SidebarLink key={item.href} item={item} />
          ))}
        </>
      )}
    </nav>
  );
}
