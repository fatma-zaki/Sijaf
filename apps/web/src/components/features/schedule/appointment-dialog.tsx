"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  appointmentSchema,
  appointmentTypeLabels,
  appointmentTypes,
  formatEgyptianMobile,
  type AppointmentData,
  type AppointmentDto,
  type AppointmentInput,
  type TeamMemberDto,
} from "@sijaf/shared";
import { Save, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { applyActionErrors } from "@/lib/forms";
import { deleteAppointment, saveAppointment } from "./actions";

export type AppointmentDefaults = Partial<AppointmentInput>;

type AppointmentDialogProps = {
  open: boolean;
  onClose: () => void;
  team: TeamMemberDto[];
  appointment?: AppointmentDto;
  /** موعد جديد: اليوم، أو بيانات العميل من العرض */
  defaults: AppointmentDefaults;
};

function toFormValues(appointment: AppointmentDto | undefined, defaults: AppointmentDefaults): AppointmentInput {
  if (!appointment) {
    return { type: "inspection", date: "", time: "10:00", technicianId: "", clientName: "", clientPhone: "", address: "", notes: "", quoteId: null, ...defaults };
  }
  return {
    type: appointment.type,
    date: appointment.date,
    time: appointment.time,
    technicianId: appointment.technician?.id ?? "",
    clientName: appointment.title,
    clientPhone: appointment.clientPhone ? formatEgyptianMobile(appointment.clientPhone) : "",
    address: appointment.address,
    notes: appointment.notes,
    quoteId: appointment.quote?.id ?? null,
  };
}

/** موعد جديد أو تعديل موعد */
export function AppointmentDialog({ open, onClose, team, appointment, defaults }: AppointmentDialogProps) {
  const formId = useId();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const form = useForm<AppointmentInput, unknown, AppointmentData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: toFormValues(appointment, defaults),
  });
  const { errors, isSubmitting } = form.formState;
  const type = useWatch({ control: form.control, name: "type" });

  useEffect(() => {
    if (open) form.reset(toFormValues(appointment, defaults));
  }, [open, appointment, defaults, form]);

  const onSubmit = form.handleSubmit(async (data) => {
    const result = await saveAppointment(appointment?.id ?? null, data);
    if (applyActionErrors(result, form.setError, ["date", "time", "technicianId", "clientName", "clientPhone", "address", "notes"])) return;
    onClose();
  });

  const delivery = type === "delivery";

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => !next && onClose()}
        title={appointment ? "تعديل الموعد" : "موعد جديد"}
        description={appointment?.quote ? `عرض سعر #${appointment.quote.number}` : undefined}
        footer={
          <>
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {isSubmitting ? "بنحفظ..." : "حفظ الموعد"}
              <Save aria-hidden />
            </Button>
            <div className="flex gap-2">
              {appointment && (
                <Button variant="danger-ghost" onClick={() => setConfirmDelete(true)}>
                  إلغاء الموعد
                  <Trash2 aria-hidden />
                </Button>
              )}
              <Button variant="secondary" onClick={onClose}>
                رجوع
              </Button>
            </div>
          </>
        }
      >
        <form id={formId} noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormError message={errors.root?.server?.message} />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-2">نوع الموعد</span>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <SegmentedControl
                  label="نوع الموعد"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={appointmentTypes.map((value) => ({ value, label: appointmentTypeLabels[value] }))}
                />
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="اليوم" error={errors.date?.message}>
              <Input type="date" aria-invalid={errors.date ? true : undefined} {...form.register("date")} />
            </Field>
            <Field label="الساعة" error={errors.time?.message}>
              <Input type="time" step={900} aria-invalid={errors.time ? true : undefined} {...form.register("time")} />
            </Field>
          </div>
          <Field label="الفني" error={errors.technicianId?.message}>
            <Select {...form.register("technicianId")}>
              <option value="">من غير فني لسه</option>
              {team.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName}
                  {member.jobTitle ? ` · ${member.jobTitle}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={delivery ? "المورد أو العميل" : "اسم العميل"} error={errors.clientName?.message}>
              <Input aria-invalid={errors.clientName ? true : undefined} {...form.register("clientName")} />
            </Field>
            <Field label={delivery ? "الموبايل (اختياري)" : "موبايل العميل"} error={errors.clientPhone?.message}>
              <Input
                type="tel"
                dir="ltr"
                inputMode="tel"
                placeholder="01xxxxxxxxx"
                className="text-end"
                aria-invalid={errors.clientPhone ? true : undefined}
                {...form.register("clientPhone")}
              />
            </Field>
          </div>
          <Field label="العنوان" error={errors.address?.message}>
            <Input placeholder={delivery ? "المحل" : "المنطقة والشارع"} {...form.register("address")} />
          </Field>
          <Field label="ملاحظات" error={errors.notes?.message}>
            <Textarea rows={2} placeholder="الدور، علامة مميزة، ميعاد بديل…" className="resize-none" {...form.register("notes")} />
          </Field>
        </form>
      </Dialog>

      {appointment && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`إلغاء موعد ${appointment.title}؟`}
          description="الموعد هيتشال من جدول الفني."
          confirmLabel="إلغاء الموعد"
          onConfirm={async () => {
            const result = await deleteAppointment(appointment.id);
            if (!result.ok) return result.message;
            onClose();
            return null;
          }}
        />
      )}
    </>
  );
}
