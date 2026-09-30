"use client";

import type { UserDto } from "@sijaf/shared";
import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { updateTechnician } from "./actions";

/** تشغيل/إيقاف الفني وصلاحية العروض من جوه القايمة */
export function TechnicianControls({ user }: { user: UserDto }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const update = (changes: { isActive?: boolean; canQuote?: boolean }) => {
    setError(null);
    startTransition(async () => {
      const result = await updateTechnician({ id: user.id, changes });
      if (!result.ok) setError(result.message);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
        <Switch
          checked={user.canQuote}
          disabled={pending || !user.isActive}
          onCheckedChange={(canQuote) => update({ canQuote })}
          label="عروض أسعار"
          aria-label={`${user.fullName} يعمل عروض أسعار`}
        />
        <Switch
          checked={user.isActive}
          disabled={pending}
          onCheckedChange={(isActive) => update({ isActive })}
          label={user.isActive ? "شغّال" : "متوقف"}
          aria-label={`حساب ${user.fullName} شغّال`}
        />
      </div>
      {error && (
        <span role="alert" className="text-xs text-danger-fg">
          {error}
        </span>
      )}
    </div>
  );
}
