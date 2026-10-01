"use server";

import { appointmentSchema, type AppointmentDto } from "@sijaf/shared";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction } from "@/lib/actions";
import type { ActionResult } from "@/lib/action-result";
import { apiRequest } from "@/lib/api/server";

const appointmentId = z.uuid();

export async function saveAppointment(id: string | null, input: unknown): Promise<ActionResult<AppointmentDto>> {
  const target = id === null ? null : appointmentId.parse(id);
  const result = await runAction(appointmentSchema, input, (data) =>
    apiRequest<AppointmentDto>(target ? `/appointments/${target}` : "/appointments", { method: target ? "PUT" : "POST", body: data }),
  );
  if (result.ok) {
    revalidatePath("/schedule");
    revalidatePath("/");
    if (result.data.quote) revalidatePath(`/quotes/${result.data.quote.id}`);
  }
  return result;
}

export async function deleteAppointment(id: string): Promise<ActionResult> {
  const result = await runAction(appointmentId, id, (target) => apiRequest<void>(`/appointments/${target}`, { method: "DELETE" }));
  if (result.ok) {
    revalidatePath("/schedule");
    revalidatePath("/");
  }
  return result;
}
