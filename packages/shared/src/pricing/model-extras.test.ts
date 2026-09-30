import { describe, expect, it } from "vitest";
import type { ModelItemDto } from "../catalog.js";
import { itemUnits, modelExtras } from "./model-extras.js";

const item = (overrides: Partial<ModelItemDto>): ModelItemDto => ({
  id: overrides.label ?? "x",
  kind: "accessory",
  materialId: null,
  label: "بند",
  price: 100,
  unitPrice: 100,
  supplierName: null,
  basis: "per_window",
  quantity: 1,
  isRequired: true,
  ...overrides,
});

// زي موديل «ويفي بريموت» في التصميم
const waveMotor = {
  pricingMethod: "linear_fullness" as const,
  fullness: 2.5,
  items: [
    item({ kind: "operation", label: "موتور مجرى ويفي", price: 3800 }),
    item({ kind: "operation", label: "ريموت 5 قنوات", price: 450 }),
    item({ kind: "operation", label: "ربط بالموبايل", price: 900, isRequired: false }),
    item({ kind: "operation", label: "تركيب وبرمجة الموتور", price: 300 }),
    item({ label: "شريط ويفي", price: 25, basis: "per_fabric_meter" }),
    item({ label: "مسكات جانبية", price: 120, basis: "per_side", isRequired: false }),
    item({ label: "شراشيب", price: 90, basis: "per_width_meter", isRequired: false }),
  ],
};

const window300x260 = { widthCm: 300, heightCm: 260 };

describe("itemUnits", () => {
  const context = { fabricUnits: 9, trackUnits: 3.5 };
  it("multiplies by the right basis", () => {
    expect(itemUnits("per_window", 1, context)).toBe(1);
    expect(itemUnits("per_side", 1, context)).toBe(2);
    expect(itemUnits("per_fabric_meter", 1, context)).toBe(9);
    expect(itemUnits("per_width_meter", 2, context)).toBe(7);
  });
});

describe("modelExtras", () => {
  it("adds motor, remote, installation and ribbon for a motorized wave curtain", () => {
    const extras = modelExtras(waveMotor, window300x260, "motorized", 3);
    expect(extras.fabricUnits).toBe(9);
    expect(extras.required.map((line) => [line.item.label, line.total])).toEqual([
      ["موتور مجرى ويفي", 3800],
      ["ريموت 5 قنوات", 450],
      ["تركيب وبرمجة الموتور", 300],
      ["شريط ويفي", 225],
    ]);
    expect(extras.requiredTotal).toBe(4775);
    expect(extras.optional.map((line) => [line.item.label, line.total])).toEqual([
      ["ربط بالموبايل", 900],
      ["مسكات جانبية", 240],
      ["شراشيب", 315],
    ]);
  });

  it("drops operation items when the curtain is manual", () => {
    const extras = modelExtras(waveMotor, window300x260, "manual", 3);
    expect(extras.required.map((line) => line.item.label)).toEqual(["شريط ويفي"]);
    expect(extras.requiredTotal).toBe(225);
  });

  it("uses square meters for roman blinds and one unit for pieces", () => {
    const roman = { pricingMethod: "square_meter" as const, fullness: 1, items: [item({ basis: "per_fabric_meter", price: 10 })] };
    // 1.2 × 1.75 = 2.1 → 2.5 م²
    expect(modelExtras(roman, { widthCm: 120, heightCm: 150 }, "manual", 3).requiredTotal).toBe(25);
    const piece = { pricingMethod: "piece" as const, fullness: 1, items: [item({ basis: "per_fabric_meter", price: 10 })] };
    expect(modelExtras(piece, window300x260, "manual", 3).fabricUnits).toBe(1);
  });
});
