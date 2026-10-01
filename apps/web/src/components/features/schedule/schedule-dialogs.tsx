"use client";

import type { AppointmentDto, TeamMemberDto } from "@sijaf/shared";
import { useMemo } from "react";
import { useUrlParams } from "@/lib/use-url-params";
import { AppointmentDialog, type AppointmentDefaults } from "./appointment-dialog";

type ScheduleDialogsProps = {
  appointments: AppointmentDto[];
  team: TeamMemberDto[];
  /** اليوم المختار (للموعد الجديد) */
  defaultDate: string;
  /** بيانات العميل لو الموعد جاي من عرض سعر (?quote=) */
  fromQuote: AppointmentDefaults | null;
};

/** النافذة بتتفتح من الـ URL: ?new=inspection أو ?edit=<id>، عشان اللينكات تفضل لينكات عادية */
export function ScheduleDialogs({ appointments, team, defaultDate, fromQuote }: ScheduleDialogsProps) {
  const { params, update } = useUrlParams();
  const newType = params.get("new");
  const editId = params.get("edit");
  const editing = editId ? appointments.find((a) => a.id === editId) : undefined;

  const defaults = useMemo<AppointmentDefaults>(
    () => ({
      date: defaultDate,
      ...(newType === "installation" || newType === "delivery" ? { type: newType } : { type: "inspection" }),
      ...fromQuote,
    }),
    [defaultDate, newType, fromQuote],
  );

  const close = () => update({ new: null, edit: null, quote: null });

  return (
    <AppointmentDialog open={Boolean(newType) || Boolean(editing)} onClose={close} team={team} appointment={editing} defaults={defaults} />
  );
}
