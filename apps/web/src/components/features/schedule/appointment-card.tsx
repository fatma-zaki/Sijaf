import { appointmentTypeLabels, formatEgyptianMobile, type AppointmentDto } from "@sijaf/shared";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/format";
import { whatsAppUrl } from "../quotes/share";
import { appointmentLooks } from "./appointment-look";

/** «مدينة نصر» أو أول العنوان؛ تسليم القماش في المحل */
export function appointmentPlace(appointment: Pick<AppointmentDto, "type" | "area" | "address">): string {
  return appointment.area || appointment.address.split("·")[0]?.trim() || (appointment.type === "delivery" ? "المحل" : "");
}

/** كارت صغير في جدول الأسبوع ومواعيد النهارده: «10:30 ص · معاينة» */
export function AppointmentCard({ appointment, href, showTechnician = true }: { appointment: AppointmentDto; href?: string; showTechnician?: boolean }) {
  const look = appointmentLooks[appointment.type];
  const place = appointmentPlace(appointment);
  const meta = [place, showTechnician ? appointment.technician?.name : null].filter(Boolean).join(" · ");
  const content = (
    <>
      <span className={cn("text-xs font-bold", look.text)}>
        {formatTime(new Date(appointment.startsAt))} · {appointmentTypeLabels[appointment.type]}
      </span>
      <span className="truncate text-base font-semibold text-ink">{appointment.title}</span>
      {meta && <span className="truncate text-xs text-ink-2">{meta}</span>}
    </>
  );
  const className = cn("flex min-w-0 flex-col gap-0.5 rounded-md px-3 py-2.5 text-start no-underline", look.box);
  return href ? (
    <Link href={href} scroll={false} className={cn(className, "hover:brightness-95")} aria-label={`تعديل موعد ${appointment.title}`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

/** كارت كامل (الموبايل والموعد الجاي): العنوان والفني وأزرار الاتصال */
export function AppointmentDetails({ appointment, editHref }: { appointment: AppointmentDto; editHref?: string }) {
  const look = appointmentLooks[appointment.type];
  const Icon = look.icon;
  const phone = appointment.clientPhone;
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-lg font-bold text-ink">{formatTime(new Date(appointment.startsAt))}</span>
        <StatusBadge icon={<Icon aria-hidden />} className={cn(look.box, look.text)}>
          {appointmentTypeLabels[appointment.type]}
        </StatusBadge>
      </div>
      <div className="flex flex-col gap-0.5">
        {editHref ? (
          <Link href={editHref} scroll={false} className="text-md font-semibold text-ink">
            {appointment.title}
          </Link>
        ) : (
          <span className="text-md font-semibold text-ink">{appointment.title}</span>
        )}
        {(appointment.address || appointment.area) && (
          <span className="flex items-center gap-1 text-sm text-ink-2">
            <MapPin aria-hidden className="size-3.5 flex-none text-ink-muted" />
            {[appointment.area, appointment.address].filter(Boolean).join(" · ")}
          </span>
        )}
        <span className="text-xs text-ink-muted">{appointment.technician ? `الفني: ${appointment.technician.name}` : "لسه مالوش فني"}</span>
      </div>
      {phone && (
        <div className="grid grid-cols-2 gap-2">
          <a href={`tel:${phone}`} className={buttonStyles({ variant: "secondary", size: "sm", className: "h-11" })} aria-label={`اتصال ${appointment.title} ${formatEgyptianMobile(phone)}`}>
            اتصال
            <Phone aria-hidden />
          </a>
          <a href={whatsAppUrl(phone, `أهلاً ${appointment.title}`)} target="_blank" rel="noopener noreferrer" className={buttonStyles({ size: "sm", className: "h-11" })}>
            واتساب
            <MessageCircle aria-hidden />
          </a>
        </div>
      )}
    </article>
  );
}
