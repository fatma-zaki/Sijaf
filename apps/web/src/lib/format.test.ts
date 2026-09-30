import { describe, expect, it } from "vitest";
import {
  daysAgo,
  formatCurrency,
  formatDaysAgo,
  formatDimensions,
  formatLongDate,
  formatMeters,
  formatNumber,
  formatPercent,
  formatRelativeDateTime,
  formatShortDate,
  formatTime,
  formatWeekdayDate,
} from "./format";

// الأربعاء 30 سبتمبر 2026 - 12:00 م بتوقيت القاهرة (UTC+3)
const now = new Date("2026-09-30T09:00:00Z");

describe("numbers", () => {
  it("uses latin digits with thousands separators", () => {
    expect(formatNumber(10700)).toBe("10,700");
    expect(formatNumber(3.5)).toBe("3.5");
  });

  it("puts the currency after the number", () => {
    expect(formatCurrency(10700)).toBe("10,700 ج.م");
    expect(formatCurrency(0)).toBe("0 ج.م");
  });

  it("formats meters, percents and dimensions", () => {
    expect(formatMeters(9)).toBe("9 م");
    expect(formatPercent(26.4)).toBe("26%");
    expect(formatDimensions(300, 260)).toBe("300 × 260 سم");
  });
});

describe("dates", () => {
  it("formats time in Cairo with ص / م", () => {
    expect(formatTime(new Date("2026-09-30T07:24:00Z"))).toBe("10:24 ص");
    expect(formatTime(new Date("2026-09-30T10:10:00Z"))).toBe("1:10 م");
  });

  it("formats relative day and time", () => {
    expect(formatRelativeDateTime(new Date("2026-09-30T07:24:00Z"), now)).toBe("اليوم - 10:24 ص");
    expect(formatRelativeDateTime(new Date("2026-09-29T10:10:00Z"), now)).toBe("أمس - 1:10 م");
    expect(formatRelativeDateTime(new Date("2026-09-26T10:15:00Z"), now)).toBe("السبت - 1:15 م");
    expect(formatRelativeDateTime(new Date("2026-09-01T10:15:00Z"), now)).toBe("2026/09/01 - 1:15 م");
  });

  it("counts days by Cairo calendar, not by 24h windows", () => {
    // 11:30 م يوم 29 بتوقيت القاهرة
    expect(daysAgo(new Date("2026-09-29T20:30:00Z"), now)).toBe(1);
    // 12:30 ص يوم 30 بتوقيت القاهرة
    expect(daysAgo(new Date("2026-09-29T21:30:00Z"), now)).toBe(0);
  });

  it("formats absolute dates", () => {
    expect(formatWeekdayDate(now)).toBe("الأربعاء 30 سبتمبر");
    expect(formatLongDate(new Date("2026-10-07T09:00:00Z"))).toBe("7 أكتوبر 2026");
    expect(formatShortDate(now)).toBe("2026/09/30");
  });

  it("formats elapsed days", () => {
    expect(formatDaysAgo(new Date("2026-09-18T09:00:00Z"), now)).toBe("منذ 12 يوم");
    expect(formatDaysAgo(new Date("2026-09-22T09:00:00Z"), now)).toBe("منذ 8 أيام");
  });
});
