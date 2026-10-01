import type { AppointmentType } from "@sijaf/shared";
import { Ruler, Truck, Wrench, type LucideIcon } from "lucide-react";

/** ألوان التصميم: المعاينة أزرق، والتركيب أخضر، وتسليم القماش أصفر */
export const appointmentLooks: Record<AppointmentType, { box: string; text: string; icon: LucideIcon }> = {
  inspection: { box: "bg-info-soft", text: "text-info", icon: Ruler },
  installation: { box: "bg-success-soft", text: "text-success", icon: Wrench },
  delivery: { box: "bg-warning-soft", text: "text-warning-fg", icon: Truck },
};
