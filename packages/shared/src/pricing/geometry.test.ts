import { describe, expect, it } from "vitest";
import { DEFAULT_ALLOWANCES, fabricMeters, railLength, roundUpTo, squareMeters, trackMeters } from "./geometry.js";

describe("roundUpTo", () => {
  it("rounds up to the next half meter", () => {
    expect(roundUpTo(8.65, 0.5)).toBe(9);
    expect(roundUpTo(7.99, 0.5)).toBe(8);
    expect(roundUpTo(3.3, 0.5)).toBe(3.5);
    expect(roundUpTo(8.5, 0.5)).toBe(8.5);
  });

  it("does not add a step because of floating point noise", () => {
    // 2.2 + 0.3 = 2.5000000000000004 في JS
    expect(roundUpTo(2.2 + 0.3, 0.5)).toBe(2.5);
  });
});

describe("fabricMeters", () => {
  it("matches the design example: 300 × 260 cm, fullness 2.5, top 3 m → 9 m", () => {
    const result = fabricMeters({ widthCm: 300, heightCm: 260, fullness: 2.5, topWidthM: 3 });
    expect(result.rail).toBeCloseTo(3.3);
    expect(result.flat).toBeCloseTo(8.65);
    expect(result.drop).toBeCloseTo(2.85);
    expect(result.widths).toBe(1);
    expect(result.meters).toBe(9);
  });

  it("uses flat meters when the drop fits in the fabric top width", () => {
    expect(fabricMeters({ widthCm: 300, heightCm: 260, fullness: 2.3, topWidthM: 3 }).meters).toBe(8);
    // drop = 3.0 بالظبط = عرض التوب
    expect(fabricMeters({ widthCm: 200, heightCm: 275, fullness: 2, topWidthM: 3 }).widths).toBe(1);
  });

  it("switches to widths × drop when the curtain is taller than the top width", () => {
    // rail 3.3، flat 8.65، drop 3.25 > 2.8 → ceil(8.65 / 2.8) = 4 عروض × 3.25 = 13
    const result = fabricMeters({ widthCm: 300, heightCm: 300, fullness: 2.5, topWidthM: 2.8 });
    expect(result.widths).toBe(4);
    expect(result.meters).toBe(13);
  });

  it("rounds widths × drop up to half a meter", () => {
    // rail 2.3، flat 5، drop 2.95 > 1.5 → 4 عروض × 2.95 = 11.8 → 12
    expect(fabricMeters({ widthCm: 200, heightCm: 270, fullness: 2, topWidthM: 1.5 }).meters).toBe(12);
  });

  it("respects custom allowances", () => {
    const allowances = { ...DEFAULT_ALLOWANCES, rail: 0, flat: 0, drop: 0, roundingStep: 1 };
    expect(fabricMeters({ widthCm: 300, heightCm: 200, fullness: 2, topWidthM: 3 }, allowances).meters).toBe(6);
  });

  it("rejects invalid measurements", () => {
    expect(() => fabricMeters({ widthCm: 0, heightCm: 200, fullness: 2, topWidthM: 3 })).toThrow(RangeError);
    expect(() => fabricMeters({ widthCm: 200, heightCm: 200, fullness: 2, topWidthM: 0 })).toThrow(RangeError);
  });
});

describe("track and area", () => {
  it("rounds the track length up to half a meter", () => {
    expect(railLength(300)).toBeCloseTo(3.3);
    expect(trackMeters(300)).toBe(3.5);
    expect(trackMeters(170)).toBe(2);
  });

  it("computes roman/roller area with the drop allowance", () => {
    // 1.2 × (1.5 + 0.25) = 2.1 → 2.5
    expect(squareMeters(120, 150)).toBe(2.5);
  });
});
