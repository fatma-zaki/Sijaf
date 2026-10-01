import { describe, expect, it } from "vitest";
import { componentSource, curtainTitle, groupQuoteLines, isQuoteExpired, quotesCountText, windowsText } from "./quote-format";

describe("groupQuoteLines", () => {
  it("groups like the design's final quote", () => {
    const groups = groupQuoteLines([
      { kind: "fabric", label: "شيفون لينين", total: 2610 },
      { kind: "fabric", label: "قطيفة تركي", total: 5040 },
      { kind: "fabric", label: "بطانة", total: 630 },
      { kind: "track", label: "مجرى مزدوج", total: 1540 },
      { kind: "labor", label: "خياطة وتفصيل", total: 630 },
      { kind: "installation", label: "تركيب", total: 250 },
      { kind: "manual", label: "فك ستارة قديمة", total: 150 },
    ]);
    expect(groups).toEqual([
      { label: "قماش وبطانة", total: 8280 },
      { label: "مجرى مزدوج", total: 1540 },
      { label: "خياطة وتركيب", total: 880 },
      { label: "فك ستارة قديمة", total: 150 },
    ]);
  });
});

describe("text helpers", () => {
  it("builds the curtain title without the model's alternate name", () => {
    expect(curtainTitle("غرفة نوم", "ويفي (موجة)")).toBe("ستارة غرفة نوم — ويفي");
    expect(curtainTitle("", null)).toBe("ستارة");
  });

  it("counts windows in Arabic", () => {
    expect([1, 2, 3, 11].map(windowsText)).toEqual(["شباك واحد", "شباكين", "3 شبابيك", "11 شباك"]);
  });
});

describe("componentSource", () => {
  const names = (id: string) => ({ satin: "ساتان تركي" })[id];

  it("credits the AI, warns on low confidence, and shows the original after an edit", () => {
    expect(componentSource({ source: "ai", confidence: 92, aiMaterialId: "x", materialId: "x" }, names)).toEqual({ tone: "ai", text: "من الذكاء الاصطناعي" });
    expect(componentSource({ source: "ai", confidence: 64, aiMaterialId: "x", materialId: "x" }, names).tone).toBe("low");
    expect(componentSource({ source: "manual", confidence: 88, aiMaterialId: "satin", materialId: "velvet" }, names)).toEqual({
      tone: "edited",
      text: "عدّلتها · كانت: ساتان تركي",
    });
    expect(componentSource({ source: "manual", confidence: null, aiMaterialId: null, materialId: "velvet" }, names).text).toBe("اختيار يدوي");
  });
});

describe("isQuoteExpired", () => {
  it("is valid through the last day in Cairo", () => {
    // 11:30 م يوم 7 أكتوبر بتوقيت القاهرة
    expect(isQuoteExpired("2026-10-07", new Date("2026-10-07T20:30:00Z"))).toBe(false);
    // 12:30 ص يوم 8 أكتوبر بتوقيت القاهرة
    expect(isQuoteExpired("2026-10-07", new Date("2026-10-07T21:30:00Z"))).toBe(true);
    expect(isQuoteExpired(null)).toBe(false);
  });
});

describe("quotesCountText", () => {
  it("uses Egyptian counting", () => {
    expect([0, 1, 2, 3, 11].map(quotesCountText)).toEqual(["مفيش عروض", "عرض واحد", "عرضين", "3 عروض", "11 عرض"]);
  });
});
