"use client";

import type { TeamMemberDto } from "@sijaf/shared";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterChips } from "@/components/ui/filter-chips";
import { useUrlParams } from "@/lib/use-url-params";

/** «كل الفنيين» / فني واحد (في الـ URL) */
export function TechnicianFilter({ team, className }: { team: TeamMemberDto[]; className?: string }) {
  const { params, update } = useUrlParams();
  const current = params.get("tech");
  const value = team.some((member) => member.id === current) ? (current as string) : "all";
  return (
    <FilterChips
      label="تصفية حسب الفني"
      className={className}
      value={value}
      onValueChange={(next) => update({ tech: next === "all" ? null : next })}
      options={[{ value: "all", label: "كل الفنيين" }, ...team.map((member) => ({ value: member.id, label: member.fullName.split(/\s+/)[0] }))]}
    />
  );
}

/** «موعد جديد»: بيفتح النافذة من الـ URL */
export function NewAppointmentButton({ iconOnly = false, className }: { iconOnly?: boolean; className?: string }) {
  const { update } = useUrlParams();
  return (
    <Button iconOnly={iconOnly} aria-label={iconOnly ? "موعد جديد" : undefined} className={className} onClick={() => update({ new: "inspection", edit: null })}>
      {!iconOnly && "موعد جديد"}
      <Plus aria-hidden />
    </Button>
  );
}
