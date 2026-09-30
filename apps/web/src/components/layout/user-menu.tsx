import { LogOut } from "lucide-react";
import { logout } from "@/components/features/auth/actions";
import { Avatar } from "@/components/ui/avatar";
import { getSession } from "@/lib/auth/session";

const MENU_ID = "user-menu";

/** الأفاتار بيفتح قايمة الحساب (HTML popover، من غير JS) */
export async function UserMenu() {
  const { user, shop } = await getSession();
  return (
    <>
      <button
        type="button"
        popoverTarget={MENU_ID}
        aria-label={`حسابك: ${user.fullName}`}
        className="touch-target cursor-pointer rounded-pill"
      >
        <Avatar name={user.fullName} />
      </button>
      <div
        id={MENU_ID}
        popover="auto"
        className="fixed inset-auto end-6 top-18 m-0 w-60 rounded-lg border border-border bg-surface p-2 text-ink-2 shadow-raised"
      >
        <div className="flex flex-col border-b border-border px-3 pb-3 pt-2">
          <span className="font-semibold text-ink">{user.fullName}</span>
          <span className="text-xs text-ink-muted">
            {shop.name} · {user.jobTitle}
          </span>
        </div>
        <form action={logout} className="pt-2">
          <button
            type="submit"
            className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-sm px-3 text-base font-medium text-danger-fg hover:bg-surface-subtle"
          >
            <LogOut aria-hidden className="size-4" />
            تسجيل خروج
          </button>
        </form>
      </div>
    </>
  );
}
