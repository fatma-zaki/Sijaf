import { describe, expect, it } from "vitest";
import { addDays, cairoDate, cairoTime, cairoToUtc, monthStart, weekStart } from "./time.js";

describe("cairo time", () => {
  it("converts local Cairo time to UTC in summer and winter", () => {
    // أكتوبر فيه توقيت صيفي (UTC+3)، ويناير لأ (UTC+2)
    expect(cairoToUtc("2026-10-01", "11:00").toISOString()).toBe("2026-10-01T08:00:00.000Z");
    expect(cairoToUtc("2026-01-15", "11:00").toISOString()).toBe("2026-01-15T09:00:00.000Z");
    expect(cairoToUtc("2026-10-01").toISOString()).toBe("2026-09-30T21:00:00.000Z");
  });

  it("reads the Cairo day and time back", () => {
    const instant = new Date("2026-09-30T21:30:00Z");
    expect(cairoDate(instant)).toBe("2026-10-01");
    expect(cairoTime(instant)).toBe("00:30");
    expect(cairoTime(cairoToUtc("2026-12-31", "23:45"))).toBe("23:45");
  });

  it("does calendar math on plain dates", () => {
    expect(addDays("2026-09-30", 2)).toBe("2026-10-02");
    // الأسبوع بيبدأ السبت
    expect(weekStart("2026-10-01")).toBe("2026-09-26");
    expect(weekStart("2026-09-26")).toBe("2026-09-26");
    expect(weekStart("2026-10-02")).toBe("2026-09-26");
    expect(monthStart("2026-10-15")).toBe("2026-10-01");
    expect(monthStart("2026-01-15", 2)).toBe("2025-11-01");
  });
});
