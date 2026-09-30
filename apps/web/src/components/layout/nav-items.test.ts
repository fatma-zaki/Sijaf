import { describe, expect, it } from "vitest";
import { isActive, primaryNav, secondaryNav, visibleNav } from "./nav-items";

const labels = (items: { label: string }[]) => items.map((item) => item.label);

describe("visibleNav", () => {
  it("shows everything to the owner", () => {
    const owner = { role: "owner" as const, canQuote: true };
    expect(labels(visibleNav(primaryNav, owner))).toEqual([
      "الرئيسية",
      "عروض الأسعار",
      "العملاء",
      "المواعيد",
      "كتالوج الأسعار",
      "التقارير",
    ]);
    expect(labels(visibleNav(secondaryNav, owner))).toEqual(["إعدادات المحل"]);
  });

  it("hides catalog, reports and settings from technicians", () => {
    const inspector = { role: "technician" as const, canQuote: true };
    expect(labels(visibleNav(primaryNav, inspector))).toEqual(["الرئيسية", "عروض الأسعار", "العملاء", "المواعيد"]);
    expect(visibleNav(secondaryNav, inspector)).toEqual([]);
  });

  it("hides quotes from installers who cannot quote", () => {
    const installer = { role: "technician" as const, canQuote: false };
    expect(labels(visibleNav(primaryNav, installer))).toEqual(["الرئيسية", "العملاء", "المواعيد"]);
  });
});

describe("isActive", () => {
  it("matches home exactly and sections by prefix", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/", "/quotes")).toBe(false);
    expect(isActive("/catalog", "/catalog/materials")).toBe(true);
    expect(isActive("/quotes", "/quotes-archive")).toBe(false);
  });
});
