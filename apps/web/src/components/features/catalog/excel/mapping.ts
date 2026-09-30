import {
  CORNICE_LOOK,
  TRACK_LOOK,
  arabicKey,
  importRowSchema,
  suggestedLooks,
  toLatinDigits,
  type ImportRowInput,
  type MaterialLayer,
  type MaterialUnit,
  type Tier,
} from "@sijaf/shared";

/** خلية من الشيت زي ما read-excel-file بيرجّعها */
export type Cell = string | number | boolean | Date | null | undefined;

export const importFields = [
  "name",
  "layer",
  "look",
  "tier",
  "supplierName",
  "supplierCode",
  "purchasePrice",
  "sellPrice",
  "unit",
  "topWidthM",
] as const;
export type ImportField = (typeof importFields)[number];
export type ColumnMapping = (ImportField | "ignore")[];

export const fieldLabels: Record<ImportField | "ignore", string> = {
  name: "اسم الخامة",
  layer: "الطبقة",
  look: "الشكل",
  tier: "المستوى",
  supplierName: "المورد",
  supplierCode: "كود المورد",
  purchasePrice: "سعر الشراء",
  sellPrice: "سعر البيع",
  unit: "الوحدة",
  topWidthM: "عرض التوب",
  ignore: "— تجاهل —",
};

/** الحقول اللي لازم تتطابق عشان الاستيراد يشتغل */
export const requiredFields: readonly ImportField[] = ["name", "sellPrice"];

// أسماء الأعمدة المحتملة (بعد arabicKey)؛ الأدق الأول
const headerSynonyms: Record<ImportField, string[]> = {
  name: ["اسم الخامه", "اسم الصنف", "الخامه", "الصنف", "الاسم", "name", "item", "product"],
  layer: ["الطبقه", "النوع", "القسم", "layer", "type", "category"],
  look: ["الشكل", "look", "style"],
  tier: ["المستوي", "الفئه", "tier", "level", "grade"],
  supplierName: ["اسم المورد", "المورد", "supplier", "vendor"],
  supplierCode: ["كود المورد", "الكود", "كود", "code", "sku"],
  purchasePrice: ["سعر الشراء", "الشراء", "التكلفه", "purchase", "cost"],
  sellPrice: ["سعر البيع", "البيع", "السعر", "sell", "price"],
  unit: ["الوحده", "unit"],
  topWidthM: ["عرض التوب", "التوب", "العرض", "top width", "width"],
};

function text(cell: Cell): string {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Date) return cell.toISOString().slice(0, 10);
  return String(cell).trim();
}

/** أول صف فيه عمودين مكتوبين على الأقل = صف العناوين */
export function findHeaderRow(rows: readonly (readonly Cell[])[]): number {
  const index = rows.findIndex((row) => row.filter((cell) => text(cell) !== "").length >= 2);
  return index === -1 ? 0 : index;
}

/** بيطابق كل عمود بحقل؛ كل حقل بياخد عمود واحد بس */
export function detectMapping(headers: readonly Cell[]): ColumnMapping {
  const keys = headers.map((header) => arabicKey(text(header)));
  const mapping: ColumnMapping = keys.map(() => "ignore");
  const taken = new Set<ImportField>();

  // المطابقة التامة الأول، وبعدها «العنوان فيه الكلمة»
  for (const exact of [true, false]) {
    for (const field of importFields) {
      if (taken.has(field)) continue;
      for (const synonym of headerSynonyms[field]) {
        const column = keys.findIndex(
          (key, index) => mapping[index] === "ignore" && key !== "" && (exact ? key === synonym : key.includes(synonym)),
        );
        if (column >= 0) {
          mapping[column] = field;
          taken.add(field);
          break;
        }
      }
    }
  }
  return mapping;
}

export function missingRequired(mapping: ColumnMapping): ImportField[] {
  return requiredFields.filter((field) => !mapping.includes(field));
}

/** «١٬٢٥٠ ج.م» أو «1,250.50» ← رقم */
export function parseNumber(cell: Cell): number | null {
  if (typeof cell === "number") return Number.isFinite(cell) ? cell : null;
  const raw = toLatinDigits(text(cell)).replace(/[٬,\s]/g, "").replace(/٫/g, ".").replace(/[^\d.-]/g, "");
  if (raw === "" || raw === "-" || raw === ".") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

const layerWords: [string[], MaterialLayer][] = [
  [["شيفون", "تل", "sheer"], "sheer"],
  [["بطانه", "lining"], "lining"],
  [["مجري", "مجاري", "كرنيشه", "كرانيش", "track", "rail"], "track"],
  [["موتور", "ريموت", "motor", "remote"], "motor"],
  [["اكسسوار", "شريط", "مسكات", "شراشيب", "accessor"], "accessory"],
  [["قماش", "اساسي", "main", "fabric"], "main"],
];

function matchLayer(value: string): MaterialLayer | null {
  const key = arabicKey(value);
  if (!key) return null;
  for (const [words, layer] of layerWords) if (words.some((word) => key.includes(word))) return layer;
  return null;
}

/** الطبقة من العمود، ولو مش واضحة من اسم الخامة، وإلا قماش أساسي */
export function parseLayer(cell: Cell, name: string): MaterialLayer {
  return matchLayer(text(cell)) ?? matchLayer(name) ?? "main";
}

export function parseTier(cell: Cell): Tier {
  const key = arabicKey(text(cell));
  if (["اقتصادي", "economy", "عادي", "رخيص"].some((word) => key.includes(word))) return "economy";
  if (["فاخر", "premium", "لوكس", "lux"].some((word) => key.includes(word))) return "premium";
  return "standard";
}

export function parseUnit(cell: Cell, layer: MaterialLayer): MaterialUnit {
  const key = arabicKey(text(cell));
  if (key.includes("طولي") || key.includes("linear")) return "linear_meter";
  if (key.includes("قطعه") || key.includes("عدد") || key.includes("piece")) return "piece";
  if (key.includes("متر") || key === "m" || key.includes("meter")) return "meter";
  if (layer === "track") return "linear_meter";
  if (layer === "motor" || layer === "accessory") return "piece";
  return "meter";
}

const GENERIC_LOOK_WORDS = new Set(["ساده"]);

/** الشكل: من العمود، أو من اسم الخامة (قطيفة، كتان…)، والمجاري لازم مجرى أو كرنيشة */
export function parseLook(cell: Cell, name: string, layer: MaterialLayer): string | null {
  const explicit = text(cell);
  const nameKeyValue = arabicKey(name);
  if (layer === "track") {
    const source = arabicKey(explicit) || nameKeyValue;
    return source.includes("كرنيش") || source.includes("كرانيش") ? CORNICE_LOOK : TRACK_LOOK;
  }
  if (explicit) return explicit;
  // أي كلمة مميزة من الشكل موجودة في الاسم («جاكار» ← «جاكار مشجر»)؛ بالترتيب عشان «قطيفة سادة» تبقى قطيفة
  for (const look of suggestedLooks[layer] ?? []) {
    const words = arabicKey(look).split(" ").filter((word) => word.length >= 3 && !GENERIC_LOOK_WORDS.has(word));
    if (words.some((word) => nameKeyValue.includes(word))) return look;
  }
  return null;
}

export type ParsedImport = {
  rows: ImportRowInput[];
  /** رقم الصف في الشيت (زي Excel، بيبدأ من 1) ورسالة المشكلة */
  errors: { row: number; message: string }[];
  suppliers: number;
};

/** صفوف الشيت ← صفوف جاهزة للـ API، والصفوف اللي فيها مشاكل بتتسجل مش بتوقف الكل */
export function buildImportRows(
  sheet: readonly (readonly Cell[])[],
  headerRow: number,
  mapping: ColumnMapping,
  fallbackSupplier: string | null = null,
): ParsedImport {
  const column = (field: ImportField) => mapping.indexOf(field);
  const rows: ImportRowInput[] = [];
  const errors: ParsedImport["errors"] = [];
  const suppliers = new Set<string>();

  sheet.slice(headerRow + 1).forEach((cells, offset) => {
    const at = (field: ImportField): Cell => (column(field) >= 0 ? cells[column(field)] : null);
    const name = text(at("name"));
    // الصفوف الفاضية بتتجاهل من غير ما تتحسب غلط
    if (cells.every((cell) => text(cell) === "")) return;

    const layer = parseLayer(at("layer"), name);
    const supplierName = text(at("supplierName")) || fallbackSupplier;
    const candidate: ImportRowInput = {
      name,
      layer,
      look: parseLook(at("look"), name, layer),
      tier: parseTier(at("tier")),
      unit: parseUnit(at("unit"), layer),
      supplierName,
      supplierCode: text(at("supplierCode")),
      purchasePrice: parseNumber(at("purchasePrice")),
      sellPrice: parseNumber(at("sellPrice")) ?? Number.NaN,
      topWidthM: parseNumber(at("topWidthM")),
    };

    const result = importRowSchema.safeParse(candidate);
    const sheetRow = headerRow + offset + 2;
    if (!result.success) {
      const issue = result.error.issues[0];
      const message = issue.path[0] === "sellPrice" ? "سعر البيع مش مكتوب أو مش رقم" : issue.message;
      errors.push({ row: sheetRow, message: name ? `${name}: ${message}` : message });
      return;
    }
    rows.push(candidate);
    if (supplierName) suppliers.add(arabicKey(supplierName));
  });

  return { rows, errors, suppliers: suppliers.size };
}
