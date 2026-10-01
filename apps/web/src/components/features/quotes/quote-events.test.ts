import type { QuoteEventDto } from "@sijaf/shared";
import { describe, expect, it } from "vitest";
import { describeEvents } from "./quote-events";

let counter = 0;
const event = (type: QuoteEventDto["type"], payload: Record<string, unknown> = {}, actorName: string | null = "محمد علي"): QuoteEventDto => ({
  id: `e${++counter}`,
  type,
  payload,
  actorName,
  createdAt: "2026-10-01T08:24:00.000Z",
});

describe("describeEvents", () => {
  it("uses the design's wording, newest first", () => {
    const entries = describeEvents([
      event("status_changed", { from: "sent", to: "accepted" }),
      event("link_opened", {}, null),
      event("sent_whatsapp"),
      event("component_changed", { slot: "main", label: "القماش الأساسي", from: "ساتان تركي", to: "قطيفة تركي" }),
      event("analyzed", { status: "ok", confidence: 87 }),
      event("photo_added"),
      event("created", {}, "عمرو"),
    ]);
    expect(entries.map((e) => [e.title, e.details])).toEqual([
      ["العميل وافق على العرض", ["بواسطة محمد"]],
      ["العميل فتح رابط العرض", []],
      ["اتبعت للعميل على واتساب", ["بواسطة محمد"]],
      ["اتعدّل القماش الأساسي", ["ساتان تركي ← قطيفة تركي"]],
      ["الذكاء الاصطناعي حلّل الصورة", ["ثقة التحليل 87%"]],
      ["اتعمل العرض", ["بواسطة عمرو"]],
    ]);
    expect(entries[0].tone).toBe("success");
  });

  it("shows repeated pricing once with the latest total", () => {
    const entries = describeEvents([
      event("priced", { tier: "premium", total: 14200 }),
      event("photo_added"),
      event("priced", { tier: "standard", total: 11000 }),
      event("status_changed", { from: "draft", to: "review" }),
      event("priced", { tier: "standard", total: 11555 }),
    ]);
    expect(entries.map((e) => [e.title, e.details])).toEqual([
      ["اتسعّر العرض", ["مستوى فاخر", "14,200 ج.م"]],
      ["الحالة اتغيّرت لـ «قيد المراجعة»", ["بواسطة محمد"]],
      ["اتسعّر العرض", ["مستوى متوسط", "11,555 ج.م"]],
    ]);
  });

  it("hides noise and survives odd payloads", () => {
    const entries = describeEvents([
      event("analyzed", { status: "unavailable" }),
      event("analyzed", { status: "unclear" }),
      event("component_changed", { label: 5 }),
      event("created", { duplicatedFrom: 1024 }, null),
      event("status_changed", { to: "weird" }),
    ]);
    expect(entries.map((e) => [e.title, e.details])).toEqual([
      ["الصورة ماكانتش واضحة للتحليل", []],
      ["اتعدّل خامة", []],
      ["اتنسخ من عرض #1024", []],
      ["الحالة اتغيّرت لـ «حالة تانية»", ["بواسطة محمد"]],
    ]);
  });

  it("describes scheduled appointments", () => {
    const [entry] = describeEvents([event("appointment_scheduled", { appointmentType: "installation", startsAt: "2026-10-01T08:00:00.000Z" })]);
    expect(entry.title).toBe("اتحدد موعد تركيب");
    expect(entry.details).toHaveLength(2);
    expect(entry.details[1]).toBe("بواسطة محمد");
  });
});
