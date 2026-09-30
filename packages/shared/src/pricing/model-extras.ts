import type { CurtainModelDto, ItemBasis, ModelItemDto, Operation } from "../catalog.js";
import { DEFAULT_ALLOWANCES, fabricMeters, squareMeters, trackMeters, type Allowances } from "./geometry.js";

/** الجوانب في الشباك الواحد: بند «لكل جنب» بيتضرب في 2 */
export const SIDES_PER_WINDOW = 2;

export type WindowSize = { widthCm: number; heightCm: number };

export type ExtraLine = {
  item: ModelItemDto;
  /** عدد الوحدات اللي البند بيتضرب فيها (أمتار أو قطع) */
  units: number;
  total: number;
};

export type ModelExtras = {
  /** البنود الإجبارية اللي بتتضاف على العرض */
  required: ExtraLine[];
  /** الاختيارية: بتظهر للعميل كإضافة */
  optional: ExtraLine[];
  requiredTotal: number;
  /** أمتار القماش لطبقة واحدة (أو المساحة للرومانية/الرول) */
  fabricUnits: number;
};

type Model = Pick<CurtainModelDto, "pricingMethod" | "fullness" | "items">;

/** عدد الوحدات لبند حسب أساس الحساب */
export function itemUnits(
  basis: ItemBasis,
  quantity: number,
  context: { fabricUnits: number; trackUnits: number },
): number {
  switch (basis) {
    case "per_window":
      return quantity;
    case "per_side":
      return quantity * SIDES_PER_WINDOW;
    case "per_fabric_meter":
      return quantity * context.fabricUnits;
    case "per_width_meter":
      return quantity * context.trackUnits;
  }
}

/** وحدات القماش لطبقة واحدة في شباك: أمتار طولية، أو متر مربع، أو قطعة */
export function modelFabricUnits(model: Pick<Model, "pricingMethod" | "fullness">, size: WindowSize, topWidthM: number, allowances: Allowances = DEFAULT_ALLOWANCES): number {
  switch (model.pricingMethod) {
    case "linear_fullness":
      return fabricMeters({ ...size, fullness: model.fullness, topWidthM }, allowances).meters;
    case "square_meter":
      return squareMeters(size.widthCm, size.heightCm, allowances);
    case "piece":
      return 1;
  }
}

const roundMoney = (value: number) => Math.round(value * 100) / 100;

/**
 * البنود اللي الموديل بيزوّدها على شباك واحد (موتور، ريموت، إكسسوارات…).
 * بنود التشغيل بتدخل لما التشغيل موتور بس.
 */
export function modelExtras(
  model: Model,
  size: WindowSize,
  operation: Operation,
  topWidthM: number,
  allowances: Allowances = DEFAULT_ALLOWANCES,
): ModelExtras {
  const fabricUnits = modelFabricUnits(model, size, topWidthM, allowances);
  const context = { fabricUnits, trackUnits: trackMeters(size.widthCm, allowances) };

  const lines = model.items
    .filter((item) => item.kind === "accessory" || operation === "motorized")
    .map((item): ExtraLine => {
      const units = itemUnits(item.basis, item.quantity, context);
      return { item, units, total: roundMoney(units * item.price) };
    });

  const required = lines.filter((line) => line.item.isRequired);
  return {
    required,
    optional: lines.filter((line) => !line.item.isRequired),
    requiredTotal: roundMoney(required.reduce((sum, line) => sum + line.total, 0)),
    fabricUnits,
  };
}
