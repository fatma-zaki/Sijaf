import { describe, expect, it } from "vitest";
import {
  buildImportRows,
  detectMapping,
  findHeaderRow,
  missingRequired,
  parseLayer,
  parseLook,
  parseNumber,
  parseTier,
  parseUnit,
} from "./mapping";

describe("detectMapping", () => {
  it("maps the design's sheet columns and ignores notes", () => {
    const mapping = detectMapping(["اسم الصنف", "النوع", "سعر الشراء", "سعر البيع", "المورد", "ملاحظات"]);
    expect(mapping).toEqual(["name", "layer", "purchasePrice", "sellPrice", "supplierName", "ignore"]);
  });

  it("handles English headers, spelling variants and partial matches", () => {
    expect(detectMapping(["Item name", "Price", "Supplier", "SKU"])).toEqual(["name", "sellPrice", "supplierName", "supplierCode"]);
    expect(detectMapping(["الخامة", "سعر البيع للمتر", "المستوى"])).toEqual(["name", "sellPrice", "tier"]);
  });

  it("gives each field one column only", () => {
    expect(detectMapping(["سعر البيع", "السعر"])).toEqual(["sellPrice", "ignore"]);
  });

  it("reports missing required fields", () => {
    expect(missingRequired(["name", "ignore"])).toEqual(["sellPrice"]);
    expect(missingRequired(["name", "sellPrice"])).toEqual([]);
  });
});

describe("cell parsing", () => {
  it("parses prices written many ways", () => {
    expect(parseNumber(560)).toBe(560);
    expect(parseNumber("1,250.5")).toBe(1250.5);
    expect(parseNumber("٥٦٠ ج.م")).toBe(560);
    expect(parseNumber("١٬٢٥٠٫٥")).toBe(1250.5);
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("غالي")).toBeNull();
  });

  it("detects layers from the column or the name", () => {
    expect(parseLayer("شيفون", "أي حاجة")).toBe("sheer");
    expect(parseLayer("قماش أساسي", "")).toBe("main");
    expect(parseLayer("", "بطانة بلاك أوت")).toBe("lining");
    expect(parseLayer("", "كرنيشة خشب")).toBe("track");
    expect(parseLayer("", "ريموت 5 قنوات")).toBe("motor");
    expect(parseLayer("", "قطيفة تركي")).toBe("main");
  });

  it("parses tiers and units with sensible defaults", () => {
    expect(parseTier("اقتصادي")).toBe("economy");
    expect(parseTier("فاخر")).toBe("premium");
    expect(parseTier("")).toBe("standard");
    expect(parseUnit("متر طولي", "main")).toBe("linear_meter");
    expect(parseUnit("", "track")).toBe("linear_meter");
    expect(parseUnit("", "motor")).toBe("piece");
    expect(parseUnit("", "sheer")).toBe("meter");
  });

  it("infers the look from the name and forces track looks", () => {
    expect(parseLook("", "قطيفة تركي", "main")).toBe("قطيفة");
    expect(parseLook("", "بلاك أوت تقيل", "main")).toBe("سادة بلاك أوت");
    expect(parseLook("", "جاكار محلي", "main")).toBe("جاكار مشجر");
    expect(parseLook("مخمل", "حاجة", "main")).toBe("مخمل");
    expect(parseLook("", "قطيفة سادة", "main")).toBe("قطيفة");
    expect(parseLook("", "كرنيشة (بلمت)", "track")).toBe("كرنيشة");
    expect(parseLook("", "مجرى ألومنيوم", "track")).toBe("مجرى");
  });
});

describe("buildImportRows", () => {
  const sheet = [
    ["قائمة أسعار ستائر الأمل"],
    [],
    ["اسم الصنف", "النوع", "سعر الشراء", "سعر البيع", "المورد", "ملاحظات"],
    ["شيفون لينين", "شيفون", 215, 290, "الأناضول للأقمشة", ""],
    ["قطيفة تركي", "قماش أساسي", "415", "560 ج.م", "الأناضول للأقمشه", "الأكثر طلبًا"],
    [null, null, null, null, null, null],
    ["كتان طبيعي", "", 545, "", "المتوسط", ""],
    ["مجرى", "مجاري", 120, 160, "", ""],
  ];

  it("finds the header row after title rows", () => {
    expect(findHeaderRow(sheet)).toBe(2);
  });

  it("builds valid rows, skips empty ones and reports bad rows with their sheet row number", () => {
    const header = findHeaderRow(sheet);
    const result = buildImportRows(sheet, header, detectMapping(sheet[header]));
    expect(result.rows.map((row) => [row.name, row.layer, row.look, row.sellPrice])).toEqual([
      ["شيفون لينين", "sheer", "لينين", 290],
      ["قطيفة تركي", "main", "قطيفة", 560],
      ["مجرى", "track", "مجرى", 160],
    ]);
    expect(result.errors).toEqual([{ row: 7, message: "كتان طبيعي: سعر البيع مش مكتوب أو مش رقم" }]);
    // «الأقمشة» و«الأقمشه» نفس المورد
    expect(result.suppliers).toBe(1);
  });

  it("uses the fallback supplier when the sheet has no supplier column", () => {
    const rows = [["الخامة", "السعر"], ["شيفون سادة", 170]];
    const result = buildImportRows(rows, 0, detectMapping(rows[0]), "النيل للمنسوجات");
    expect(result.rows[0].supplierName).toBe("النيل للمنسوجات");
  });
});
