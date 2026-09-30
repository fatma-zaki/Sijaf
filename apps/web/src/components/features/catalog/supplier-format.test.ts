import { describe, expect, it } from "vitest";
import { leadTimeText, paymentText, pricesAge, supplierInitials } from "./supplier-format";

describe("supplier formatting", () => {
  it("writes payment terms", () => {
    expect(paymentText({ paymentMethod: "credit", creditDays: 30 })).toBe("آجل 30 يوم");
    expect(paymentText({ paymentMethod: "credit", creditDays: null })).toBe("آجل");
    expect(paymentText({ paymentMethod: "cash", creditDays: null })).toBe("كاش");
  });

  it("writes lead times like the design", () => {
    expect(leadTimeText({ leadTimeMinDays: 3, leadTimeMaxDays: 5 })).toBe("3 – 5 أيام");
    expect(leadTimeText({ leadTimeMinDays: 7, leadTimeMaxDays: 14 })).toBe("7 – 14 يوم");
    expect(leadTimeText({ leadTimeMinDays: 2, leadTimeMaxDays: 2 })).toBe("يومين");
    expect(leadTimeText({ leadTimeMinDays: null, leadTimeMaxDays: 4 })).toBe("4 أيام");
    expect(leadTimeText({ leadTimeMinDays: null, leadTimeMaxDays: null })).toBe("—");
  });

  it("flags prices older than 60 days", () => {
    const now = new Date("2026-10-01T09:00:00Z");
    expect(pricesAge({ pricesUpdatedAt: "2026-07-18T09:00:00Z" }, now)).toEqual({ days: 75, stale: true });
    expect(pricesAge({ pricesUpdatedAt: "2026-09-19T09:00:00Z" }, now)).toEqual({ days: 12, stale: false });
  });

  it("builds initials without the Arabic article", () => {
    expect(supplierInitials("الأناضول للأقمشة")).toBe("أن");
    expect(supplierInitials("النيل للمنسوجات")).toBe("ني");
    expect(supplierInitials("باريس")).toBe("با");
  });
});
