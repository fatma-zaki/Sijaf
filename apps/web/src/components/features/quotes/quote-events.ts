import { appointmentTypeLabels, quoteStatusLabels, tierLabels, type AppointmentType, type QuoteEventDto, type QuoteStatus, type Tier } from "@sijaf/shared";
import { formatCurrency, formatRelativeDateTime } from "@/lib/format";

export type TimelineIcon = "created" | "ai" | "edit" | "priced" | "sent" | "opened" | "accepted" | "rejected" | "status" | "pdf" | "appointment";
export type TimelineTone = "success" | "info" | "warning" | "neutral";

export type TimelineEntry = {
  id: string;
  icon: TimelineIcon;
  tone: TimelineTone;
  /** «اتعدّل القماش الأساسي» */
  title: string;
  /** بعد الوقت: «بواسطة محمد»، «ساتان تركي ← قطيفة تركي» */
  details: string[];
  createdAt: string;
};

const text = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value : null);
const num = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);

function isStatus(value: unknown): value is QuoteStatus {
  return typeof value === "string" && value in quoteStatusLabels;
}
function isAppointmentType(value: unknown): value is AppointmentType {
  return typeof value === "string" && value in appointmentTypeLabels;
}
function isTier(value: unknown): value is Tier {
  return typeof value === "string" && value in tierLabels;
}

/** «بواسطة محمد» بالاسم الأول بس زي التصميم */
function byActor(name: string | null): string[] {
  const first = name?.trim().split(/\s+/)[0];
  return first ? [`بواسطة ${first}`] : [];
}

function describe(event: QuoteEventDto): Omit<TimelineEntry, "id" | "createdAt"> | null {
  const { payload } = event;
  switch (event.type) {
    case "created": {
      const from = num(payload.duplicatedFrom);
      return { icon: "created", tone: "neutral", title: from ? `اتنسخ من عرض #${from}` : "اتعمل العرض", details: byActor(event.actorName) };
    }
    case "analyzed": {
      const confidence = num(payload.confidence);
      if (payload.status === "ok") {
        return { icon: "ai", tone: "info", title: "الذكاء الاصطناعي حلّل الصورة", details: confidence !== null ? [`ثقة التحليل ${confidence}%`] : [] };
      }
      if (payload.status === "unclear") return { icon: "ai", tone: "warning", title: "الصورة ماكانتش واضحة للتحليل", details: [] };
      if (payload.status === "not_curtain") return { icon: "ai", tone: "warning", title: "الصورة ماكانش فيها ستارة", details: [] };
      // مش متاح / خطأ / من غير صورة: مالهمش لازمة في السجل
      return null;
    }
    case "component_changed": {
      const label = text(payload.label) ?? "خامة";
      const from = text(payload.from);
      const to = text(payload.to);
      return { icon: "edit", tone: "neutral", title: `اتعدّل ${label}`, details: from && to ? [`${from} ← ${to}`] : [] };
    }
    case "priced": {
      const total = num(payload.total);
      return {
        icon: "priced",
        tone: "neutral",
        title: "اتسعّر العرض",
        details: [...(isTier(payload.tier) ? [`مستوى ${tierLabels[payload.tier]}`] : []), ...(total !== null ? [formatCurrency(total)] : [])],
      };
    }
    case "status_changed": {
      if (payload.to === "accepted") return { icon: "accepted", tone: "success", title: "العميل وافق على العرض", details: byActor(event.actorName) };
      if (payload.to === "rejected") return { icon: "rejected", tone: "warning", title: "العميل رفض العرض", details: byActor(event.actorName) };
      const to = isStatus(payload.to) ? quoteStatusLabels[payload.to] : "حالة تانية";
      return { icon: "status", tone: "neutral", title: `الحالة اتغيّرت لـ «${to}»`, details: byActor(event.actorName) };
    }
    case "sent_whatsapp":
      return { icon: "sent", tone: "success", title: "اتبعت للعميل على واتساب", details: byActor(event.actorName) };
    case "link_opened":
      return { icon: "opened", tone: "info", title: "العميل فتح رابط العرض", details: [] };
    case "pdf_downloaded":
      return { icon: "pdf", tone: "info", title: "العميل حمّل العرض PDF", details: [] };
    case "appointment_scheduled": {
      const type = isAppointmentType(payload.appointmentType) ? appointmentTypeLabels[payload.appointmentType] : "موعد";
      const startsAt = text(payload.startsAt);
      return {
        icon: "appointment",
        tone: "info",
        title: `اتحدد موعد ${type}`,
        details: [...(startsAt ? [formatRelativeDateTime(new Date(startsAt))] : []), ...byActor(event.actorName)],
      };
    }
    case "photo_added":
      return null;
  }
}

/**
 * سجل العرض من الأحدث للأقدم بنصوص التصميم.
 * التسعير المتكرر ورا بعضه (كل «متابعة» في صفحة التسعير) بيظهر مرة واحدة بآخر سعر.
 */
export function describeEvents(events: readonly QuoteEventDto[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  let previousType: QuoteEventDto["type"] | null = null;
  for (const event of events) {
    const repeatedPricing = event.type === "priced" && previousType === "priced";
    const described = repeatedPricing ? null : describe(event);
    if (described) entries.push({ id: event.id, createdAt: event.createdAt, ...described });
    if (event.type !== "photo_added") previousType = event.type;
  }
  return entries;
}
