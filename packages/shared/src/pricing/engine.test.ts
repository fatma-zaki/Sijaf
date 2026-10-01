import { describe, expect, it } from "vitest";
import type { ModelItemDto } from "../catalog.js";
import {
  EMPTY_EDITS,
  applyEdits,
  equivalentMaterial,
  priceAllTiers,
  priceTier,
  quoteTotals,
  type PricingInput,
  type PricingMaterial,
} from "./engine.js";
import { DEFAULT_PRICING_RULES } from "./rules.js";

const mat = (id: string, layer: PricingMaterial["layer"], look: string | null, tier: PricingMaterial["tier"], sellPrice: number, topWidthM: number | null = 3): PricingMaterial => ({
  id,
  name: id,
  layer,
  look,
  tier,
  sellPrice,
  topWidthM,
});

// من القايمة النموذجية
const catalog: PricingMaterial[] = [
  mat("شيفون سادة", "sheer", "سادة", "economy", 170),
  mat("شيفون لينين", "sheer", "لينين", "standard", 290),
  mat("شيفون تركي مطرز", "sheer", "مطرز", "premium", 520),
  mat("قطيفة محلي", "main", "قطيفة", "economy", 360),
  mat("قطيفة تركي", "main", "قطيفة", "standard", 560),
  mat("قطيفة إيطالي", "main", "قطيفة", "premium", 900),
  mat("كتان صناعي", "main", "كتان", "economy", 280),
  mat("كتان مخلوط", "main", "كتان", "standard", 440),
  mat("بطانة عادية", "lining", "عادية", "standard", 70),
  mat("بطانة بلاك أوت", "lining", "بلاك أوت", "premium", 120),
  mat("مجرى ألومنيوم", "track", "مجرى", "economy", 160, null),
  mat("مجرى تقيل", "track", "مجرى", "standard", 220, null),
  mat("مجرى ويفي", "track", "مجرى", "premium", 340, null),
  mat("كرنيشة", "track", "كرنيشة", "standard", 450, null),
];

const item = (id: string, overrides: Partial<ModelItemDto>): ModelItemDto => ({
  id,
  kind: "accessory",
  materialId: null,
  label: id,
  price: 0,
  unitPrice: null,
  supplierName: null,
  basis: "per_window",
  quantity: 1,
  isRequired: true,
  ...overrides,
});

const wave = { pricingMethod: "linear_fullness" as const, fullness: 2.5, laborPerUnit: 70, items: [] };

// مثال التصميم: شباك 300 × 260، ويفي، شيفون لينين + قطيفة تركي + بطانة + مجرى
const base: PricingInput = {
  widthCm: 300,
  heightCm: 260,
  windowCount: 1,
  model: wave,
  operation: "manual",
  optionalItemIds: [],
  selections: { sheer: "شيفون لينين", main: "قطيفة تركي", lining: "بطانة عادية", track: "مجرى تقيل" },
  catalog,
  rules: DEFAULT_PRICING_RULES,
};

const summary = (input: PricingInput, tier: "economy" | "standard" | "premium" = "standard") =>
  priceTier(input, tier).lines.map((l) => [l.key, l.label, l.quantityLabel, l.unitPrice, l.total]);

describe("priceTier: the design example (standard tier)", () => {
  it("prices every line from the formulas", () => {
    expect(summary(base)).toEqual([
      ["fabric:sheer", "شيفون لينين", "9 م", 290, 2610],
      ["fabric:main", "قطيفة تركي", "9 م", 560, 5040],
      ["fabric:lining", "بطانة عادية", "9 م", 70, 630],
      // المصنعية على الشيفون والقماش الأساسي (مش البطانة): 18 م × 70
      ["labor", "خياطة وتفصيل", "18 م", 70, 1260],
      // مجرين لأن فيه شيفون وقماش أساسي
      ["track", "مجرى مزدوج", "2 × 3.5 م", 220, 1540],
      ["installation", "تركيب", "1", 250, 250],
    ]);
    expect(priceTier(base, "standard").subtotal).toBe(11330);
  });

  it("is deterministic", () => {
    expect(priceAllTiers(base)).toEqual(priceAllTiers(structuredClone(base)));
  });
});

describe("tiers", () => {
  it("each tier takes the nearest material of the same look", () => {
    const tiersResult = priceAllTiers(base);
    const names = (tier: keyof typeof tiersResult) => tiersResult[tier].lines.filter((l) => l.kind === "fabric" || l.kind === "track").map((l) => l.label);
    expect(names("economy")).toEqual(["شيفون سادة", "قطيفة محلي", "بطانة عادية", "مجرى مزدوج"]);
    expect(tiersResult.economy.materials.main?.id).toBe("قطيفة محلي");
    expect(tiersResult.premium.materials.main?.id).toBe("قطيفة إيطالي");
    expect(tiersResult.premium.materials.lining?.id).toBe("بطانة بلاك أوت");
    expect(tiersResult.premium.materials.track?.id).toBe("مجرى ويفي");
    expect(tiersResult.economy.subtotal).toBeLessThan(tiersResult.standard.subtotal);
    expect(tiersResult.standard.subtotal).toBeLessThan(tiersResult.premium.subtotal);
  });

  it("falls back to the same layer when the look has no match, then to the chosen material", () => {
    const linen = catalog.find((m) => m.id === "كتان مخلوط") as PricingMaterial;
    // مفيش كتان فاخر → أقرب قماش أساسي فاخر في السعر
    expect(equivalentMaterial(linen, "premium", catalog).id).toBe("قطيفة إيطالي");
    const lining = catalog.find((m) => m.id === "بطانة عادية") as PricingMaterial;
    // مفيش بطانة اقتصادي → نفس البطانة
    expect(equivalentMaterial(lining, "economy", catalog).id).toBe("بطانة عادية");
  });

  it("never swaps a track for a cornice", () => {
    const cornice = catalog.find((m) => m.id === "كرنيشة") as PricingMaterial;
    expect(equivalentMaterial(cornice, "premium", catalog).id).toBe("كرنيشة");
  });
});

describe("fabric meters", () => {
  it("uses widths × drop when the curtain is taller than the fabric top", () => {
    const narrow = [...catalog.filter((m) => m.id !== "قطيفة تركي"), mat("قطيفة تركي", "main", "قطيفة", "standard", 560, 2.8)];
    const input = { ...base, heightCm: 300, catalog: narrow, selections: { main: "قطيفة تركي" } };
    // flat 8.65، drop 3.25 > 2.8 → 4 عروض × 3.25 = 13 م
    expect(summary(input)[0]).toEqual(["fabric:main", "قطيفة تركي", "13 م", 560, 7280]);
  });

  it("uses the shop default top width when the material has none", () => {
    const noTop = [mat("شيفون", "sheer", null, "standard", 100, null)];
    const input = { ...base, catalog: noTop, selections: { sheer: "شيفون" }, rules: { ...DEFAULT_PRICING_RULES, defaultTopWidthM: 2.8 } };
    // drop 2.85 > 2.8 → ceil(8.65 / 2.8) = 4 عروض × 2.85 = 11.4 → 11.5
    expect(summary(input)[0][2]).toBe("11.5 م");
  });

  it("rounds meters up to half a meter", () => {
    const input = { ...base, model: { ...wave, fullness: 2.3 }, selections: { main: "قطيفة تركي" } };
    // 3.3 × 2.3 + 0.4 = 7.99 → 8
    expect(summary(input)[0][2]).toBe("8 م");
  });
});

describe("labor, track and cornice", () => {
  it("uses a single track and no labor on lining alone", () => {
    const input = { ...base, selections: { main: "قطيفة تركي", lining: "بطانة عادية", track: "مجرى تقيل" } };
    const lines = summary(input);
    expect(lines.find((l) => l[0] === "track")).toEqual(["track", "مجرى مفرد", "3.5 م", 220, 770]);
    expect(lines.find((l) => l[0] === "labor")).toEqual(["labor", "خياطة وتفصيل", "9 م", 70, 630]);
  });

  it("adds a cornice from the catalog, or at the shop price", () => {
    const withCornice = summary({ ...base, selections: { ...base.selections, cornice: "كرنيشة" } });
    expect(withCornice.find((l) => l[0] === "cornice")).toEqual(["cornice", "كرنيشة", "3.5 م", 450, 1575]);
    const fallback = summary({ ...base, useDefaultCornice: true, rules: { ...DEFAULT_PRICING_RULES, cornicePerMeter: 400 } });
    expect(fallback.find((l) => l[0] === "cornice")).toEqual(["cornice", "كرنيشة", "3.5 م", 400, 1400]);
  });

  it("has no track line for roman or roller models", () => {
    const roman = { pricingMethod: "square_meter" as const, fullness: 1, laborPerUnit: 150, items: [] };
    const lines = summary({ ...base, widthCm: 120, heightCm: 150, model: roman, selections: { main: "قطيفة تركي", track: "مجرى تقيل" } });
    // 1.2 × 1.75 = 2.1 → 2.5 م²
    expect(lines).toEqual([
      ["fabric:main", "قطيفة تركي", "2.5 م²", 560, 1400],
      ["labor", "خياطة وتفصيل", "2.5 م²", 150, 375],
      ["installation", "تركيب", "1", 250, 250],
    ]);
  });

  it("charges one unit per window for piece models", () => {
    const piece = { pricingMethod: "piece" as const, fullness: 1, laborPerUnit: 100, items: [] };
    expect(summary({ ...base, model: piece, selections: { main: "قطيفة تركي" } }).slice(0, 2)).toEqual([
      ["fabric:main", "قطيفة تركي", "1", 560, 560],
      ["labor", "خياطة وتفصيل", "1", 100, 100],
    ]);
  });
});

describe("model items", () => {
  const motorModel = {
    ...wave,
    items: [
      item("motor", { kind: "operation", label: "موتور", price: 3800 }),
      item("remote", { kind: "operation", label: "ريموت", price: 450 }),
      item("wifi", { kind: "operation", label: "ربط بالموبايل", price: 900, isRequired: false }),
      item("ribbon", { label: "شريط ويفي", price: 25, basis: "per_fabric_meter" }),
      item("ties", { label: "مسكات", price: 120, basis: "per_side", isRequired: false }),
      item("tassel", { label: "شراشيب", price: 90, basis: "per_width_meter", isRequired: false }),
    ],
  };

  it("adds required items, operation items only when motorized, and chosen optional ones", () => {
    const manual = summary({ ...base, model: motorModel }).filter((l) => String(l[0]).startsWith("item:"));
    expect(manual).toEqual([["item:ribbon", "شريط ويفي", "9 م", 25, 225]]);

    const motorized = summary({ ...base, model: motorModel, operation: "motorized", optionalItemIds: ["ties", "tassel"] }).filter((l) =>
      String(l[0]).startsWith("item:"),
    );
    expect(motorized).toEqual([
      ["item:motor", "موتور", "1", 3800, 3800],
      ["item:remote", "ريموت", "1", 450, 450],
      ["item:ribbon", "شريط ويفي", "9 م", 25, 225],
      ["item:ties", "مسكات", "2", 120, 240],
      ["item:tassel", "شراشيب", "3.5 م", 90, 315],
    ]);
  });
});

describe("window count", () => {
  it("multiplies every line by the number of windows", () => {
    const three = priceTier({ ...base, windowCount: 3 }, "standard");
    expect(three.lines.map((l) => [l.key, l.quantityLabel, l.total])).toEqual([
      ["fabric:sheer", "9 م × 3", 7830],
      ["fabric:main", "9 م × 3", 15120],
      ["fabric:lining", "9 م × 3", 1890],
      ["labor", "18 م × 3", 3780],
      ["track", "2 × 3.5 م × 3", 4620],
      ["installation", "3", 750],
    ]);
    expect(three.subtotal).toBe(priceTier(base, "standard").subtotal * 3);
  });
});

describe("edits and totals", () => {
  const lines = priceTier(base, "standard").lines;

  it("keeps the originals when a line is edited, removed or added", () => {
    const edited = applyEdits(lines, {
      overrides: { labor: { quantity: 9 } },
      removed: ["fabric:lining"],
      manual: [{ key: "manual:1", label: "فك ستارة قديمة", quantity: 1, unitPrice: 150 }],
    });
    expect(edited.find((l) => l.key === "labor")).toMatchObject({ quantity: 9, total: 630, isEdited: true, originalQuantity: 18, quantityLabel: "9" });
    expect(edited.some((l) => l.key === "fabric:lining")).toBe(false);
    expect(edited.at(-1)).toMatchObject({ source: "manual", total: 150, isEdited: false });
    expect(applyEdits(lines, EMPTY_EDITS).every((l) => !l.isEdited)).toBe(true);
  });

  it("does not mark a line as edited when the value is unchanged", () => {
    expect(applyEdits(lines, { ...EMPTY_EDITS, overrides: { labor: { quantity: 18 } } }).find((l) => l.key === "labor")?.isEdited).toBe(false);
  });

  it("applies discount and deposit", () => {
    expect(quoteTotals([{ total: 10700 }], 0, 30)).toEqual({ subtotal: 10700, discount: 0, total: 10700, deposit: 3210 });
    expect(quoteTotals([{ total: 10700 }], 700, 30)).toEqual({ subtotal: 10700, discount: 700, total: 10000, deposit: 3000 });
    // الخصم مايزيدش عن الإجمالي ومايبقاش بالسالب
    expect(quoteTotals([{ total: 500 }], 900, 30).total).toBe(0);
    expect(quoteTotals([{ total: 500 }], -50, 30).discount).toBe(0);
  });
});
