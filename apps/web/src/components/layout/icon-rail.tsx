import type { UserDto } from "@sijaf/shared";
import { Logo } from "@/components/ui/logo";
import { primaryNav, secondaryNav, visibleNav, type NavItem } from "./nav-items";
import { NavLink } from "./nav-link";

function RailLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      href={item.href}
      aria-label={item.label}
      title={item.label}
      className="grid size-12 place-items-center rounded-sm text-on-pine hover:bg-pine-800 hover:text-on-pine aria-[current=page]:bg-pine-700"
    >
      <Icon aria-hidden className="size-5" />
    </NavLink>
  );
}

/** قايمة أيقونات بس: تابلت (600–1024) */
export function IconRail({ user }: { user: UserDto }) {
  const secondary = visibleNav(secondaryNav, user);
  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="sticky top-0 hidden h-dvh w-rail flex-none flex-col items-center gap-1.5 overflow-y-auto bg-pine-900 py-4 md:flex lg:hidden"
    >
      <div className="mb-3.5">
        <Logo markOnly />
      </div>
      {visibleNav(primaryNav, user).map((item) => (
        <RailLink key={item.href} item={item} />
      ))}
      {secondary.length > 0 && (
        <>
          <span role="separator" className="my-2 h-px w-8 bg-pine-800" />
          {secondary.map((item) => (
            <RailLink key={item.href} item={item} />
          ))}
        </>
      )}
    </nav>
  );
}
