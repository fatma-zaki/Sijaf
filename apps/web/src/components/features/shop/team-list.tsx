import type { UserDto } from "@sijaf/shared";
import { formatEgyptianMobile } from "@sijaf/shared";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import { TechnicianControls } from "./technician-controls";

function permissionsLabel(user: UserDto): string {
  if (user.role === "owner") return "كل الصلاحيات";
  return user.canQuote ? "عروض الأسعار والمواعيد" : "المواعيد بس";
}

/** فريق المحل زي قسم «المستخدمين» في الإعدادات */
export function TeamList({ users }: { users: UserDto[] }) {
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {users.map((user) => (
        <li
          key={user.id}
          className={cn(
            "flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-b-0",
            !user.isActive && "opacity-60",
          )}
        >
          <Avatar name={user.fullName} />
          <div className="flex min-w-0 grow flex-col">
            <span className="font-semibold text-ink">{user.fullName}</span>
            <span className="text-xs text-ink-muted">
              <span dir="ltr">{formatEgyptianMobile(user.phone)}</span> · {permissionsLabel(user)}
            </span>
          </div>
          {user.role === "owner" ? (
            <StatusBadge tone="info">صاحب المحل</StatusBadge>
          ) : (
            <>
              <StatusBadge tone="neutral">{user.jobTitle || "فني"}</StatusBadge>
              <TechnicianControls user={user} />
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
