import {
  addDays,
  appointmentTypeLabels,
  appointmentTypes,
  cairoDate,
  datePattern,
  formatEgyptianMobile,
  weekday,
  weekStart,
  type AppointmentDto,
  type QuoteDto,
  type TeamMemberDto,
} from "@sijaf/shared";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AppointmentCard, AppointmentDetails } from "@/components/features/schedule/appointment-card";
import { appointmentLooks } from "@/components/features/schedule/appointment-look";
import type { AppointmentDefaults } from "@/components/features/schedule/appointment-dialog";
import { ScheduleDialogs } from "@/components/features/schedule/schedule-dialogs";
import { NewAppointmentButton, TechnicianFilter } from "@/components/features/schedule/technician-filter";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { apiRequest } from "@/lib/api/server";
import { getSession } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { dayToDate, formatDayMonth, formatDayNumber, formatShortWeekday, formatWeekday, formatWeekdayDate } from "@/lib/format";

export const metadata: Metadata = { title: "المواعيد" };

const FRIDAY = 5;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SchedulePage({ searchParams }: PageProps<"/schedule">) {
  const { user } = await getSession();
  const raw = await searchParams;
  const today = cairoDate(new Date());
  const weekParam = first(raw.week);
  const start = weekStart(weekParam && datePattern.test(weekParam) ? weekParam : today);
  const end = addDays(start, 6);
  const tech = first(raw.tech);
  const quoteId = first(raw.quote);
  const canEdit = user.canQuote;

  const query = new URLSearchParams({ from: start, to: end });
  const [appointments, team, quote] = await Promise.all([
    apiRequest<AppointmentDto[]>(`/appointments?${query}`),
    apiRequest<TeamMemberDto[]>("/team"),
    canEdit && quoteId ? apiRequest<QuoteDto>(`/quotes/${encodeURIComponent(quoteId)}`).catch(() => null) : Promise.resolve(null),
  ]);
  const technician = team.find((member) => member.id === tech);
  const shown = technician ? appointments.filter((a) => a.technician?.id === technician.id) : appointments;

  // الجمعة أجازة: بتظهر بس لو فيها مواعيد أو لو هي النهارده
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index)).filter(
    (day) => weekday(day) !== FRIDAY || day === today || shown.some((a) => a.date === day),
  );
  const dayParam = first(raw.day);
  const selectedDay = days.find((day) => day === dayParam) ?? (days.includes(today) ? today : days[0]);

  // اللينكات بتحافظ على الفلاتر
  const href = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams();
    for (const key of ["week", "tech", "day"] as const) {
      const value = first(raw[key]);
      if (value) params.set(key, value);
    }
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    return `/schedule${params.size ? `?${params}` : ""}`;
  };
  const editHref = (appointment: AppointmentDto) => (canEdit ? href({ edit: appointment.id }) : undefined);
  const weekHref = (target: string) => href({ week: target === weekStart(today) ? null : target, day: null });

  const fromQuote: AppointmentDefaults | null = quote
    ? {
        quoteId: quote.id,
        clientName: quote.client.name,
        clientPhone: formatEgyptianMobile(quote.client.phone),
        address: quote.client.area,
        type: quote.status === "accepted" ? "installation" : "inspection",
      }
    : null;

  const range = `الأسبوع من ${formatDayMonth(dayToDate(start))} لـ ${formatDayMonth(dayToDate(end))}`;
  const empty = shown.length === 0;

  return (
    <>
      <PageHeader
        title="المواعيد"
        subtitle={<span className="hidden md:inline">{range}</span>}
        backHref="/more"
        actions={canEdit && <NewAppointmentButton iconOnly className="md:hidden" />}
      />

      {/* الأسبوع والفلاتر */}
      <Card className="flex flex-col gap-3 p-3 md:p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={weekHref(addDays(start, -7))} aria-label="الأسبوع السابق" className={buttonStyles({ variant: "secondary", iconOnly: true })}>
            <ChevronRight aria-hidden />
          </Link>
          <Link href={weekHref(weekStart(today))} className={buttonStyles({ variant: start === weekStart(today) ? "soft" : "secondary" })}>
            هذا الأسبوع
          </Link>
          <Link href={weekHref(addDays(start, 7))} aria-label="الأسبوع التالي" className={buttonStyles({ variant: "secondary", iconOnly: true })}>
            <ChevronLeft aria-hidden />
          </Link>
          <span className="text-sm text-ink-muted md:hidden">{range}</span>
        </div>
        {team.length > 1 && <TechnicianFilter team={team} />}
        <div className="hidden items-center gap-4 md:flex">
          <ul aria-label="أنواع المواعيد" className="m-0 flex list-none gap-3 p-0">
            {appointmentTypes.map((type) => (
              <li key={type} className="flex items-center gap-1.5 text-xs text-ink-2">
                <span aria-hidden className={cn("size-2.5 rounded-pill", appointmentLooks[type].box, "border border-current", appointmentLooks[type].text)} />
                {appointmentTypeLabels[type]}
              </li>
            ))}
          </ul>
          {canEdit && <NewAppointmentButton />}
        </div>
      </Card>

      {/* تابلت ولابتوب: الأسبوع كله */}
      <Card className="hidden flex-col p-0 md:flex">
        <div className={cn("grid md:grid-cols-3", days.length === 7 ? "lg:grid-cols-7" : "lg:grid-cols-6")}>
          {days.map((day) => {
            const items = shown.filter((a) => a.date === day);
            return (
              <section
                key={day}
                aria-label={formatWeekdayDate(dayToDate(day))}
                className={cn("flex min-h-40 min-w-0 flex-col gap-2 border-b border-e border-border p-2", day === today && "bg-primary-soft/40")}
              >
                <div className="flex items-baseline justify-between border-b border-border px-1 pb-1.5">
                  <span className="text-base font-bold text-ink">{formatWeekday(dayToDate(day))}</span>
                  <span className={cn("text-xl font-bold", day === today ? "text-primary" : "text-ink-2")}>{formatDayNumber(dayToDate(day))}</span>
                </div>
                {items.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} href={editHref(appointment)} showTechnician={!technician} />
                ))}
              </section>
            );
          })}
        </div>
        {empty && (
          <EmptyState
            icon={<CalendarDays aria-hidden />}
            title="مفيش مواعيد الأسبوع ده"
            description="لما العميل يوافق على العرض، حدّد موعد المعاينة أو التركيب ووزّعه على الفنيين، وكل فني هيشوف مواعيده على موبايله."
            actions={canEdit && <NewAppointmentButton />}
          />
        )}
      </Card>

      {/* موبايل: يوم واحد */}
      <div className="flex flex-col gap-3 md:hidden">
        <nav aria-label="أيام الأسبوع" className="grid auto-cols-fr grid-flow-col gap-1">
          {days.map((day) => (
            <Link
              key={day}
              href={href({ day })}
              scroll={false}
              aria-current={day === selectedDay ? "date" : undefined}
              className="flex min-w-0 flex-col items-center rounded-md border border-border bg-surface py-1.5 text-xs text-ink-2 no-underline aria-[current=date]:border-primary aria-[current=date]:bg-primary aria-[current=date]:text-on-primary"
            >
              {formatShortWeekday(dayToDate(day))}
              <span className="text-lg font-bold">{formatDayNumber(dayToDate(day))}</span>
            </Link>
          ))}
        </nav>
        <h2 className="m-0 text-md font-bold text-ink">{formatWeekdayDate(dayToDate(selectedDay))}</h2>
        {shown.filter((a) => a.date === selectedDay).map((appointment) => (
          <AppointmentDetails key={appointment.id} appointment={appointment} editHref={editHref(appointment)} />
        ))}
        {!shown.some((a) => a.date === selectedDay) && (
          <Card>
            <EmptyState icon={<CalendarDays aria-hidden />} title="مفيش مواعيد اليوم ده" description="اختار يوم تاني من فوق، أو حدّد موعد جديد." className="py-6" />
          </Card>
        )}
      </div>

      {team.length > 1 && (
        <Card className="flex flex-col gap-3">
          <CardTitle className="text-md">الفنيين</CardTitle>
          <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2 lg:grid-cols-4">
            {team
              .filter((member) => !member.isOwner)
              .map((member) => {
                const count = appointments.filter((a) => a.technician?.id === member.id).length;
                return (
                  <li key={member.id} className="flex items-center gap-3">
                    <Avatar name={member.fullName} size="sm" />
                    <span className="flex flex-col">
                      <span className="text-base font-semibold text-ink">{member.fullName}</span>
                      <span className="text-xs text-ink-muted">
                        {member.jobTitle || "فني"} · {count === 0 ? "مفيش مواعيد الأسبوع ده" : `${count} ${count <= 10 && count > 2 ? "مواعيد" : "موعد"} الأسبوع ده`}
                      </span>
                    </span>
                  </li>
                );
              })}
          </ul>
          <p className="m-0 text-xs text-ink-muted">كل فني بيشوف مواعيده في الرئيسية على موبايله، مع العنوان ورقم العميل.</p>
        </Card>
      )}

      {canEdit && <ScheduleDialogs appointments={appointments} team={team} defaultDate={selectedDay} fromQuote={fromQuote} />}
    </>
  );
}
