import type { MaterialLayer } from "@sijaf/shared";
import { Blinds, Gem, Layers, Layers2, Ruler, Wind, Zap, type LucideIcon } from "lucide-react";

export const allLayersIcon: LucideIcon = Layers;

export const layerIcons: Record<MaterialLayer, LucideIcon> = {
  sheer: Wind,
  main: Blinds,
  lining: Layers2,
  track: Ruler,
  accessory: Gem,
  motor: Zap,
};
