"use server";

import { createClientSchema, type ClientDto } from "@sijaf/shared";
import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions";
import type { ActionResult } from "@/lib/action-result";
import { apiRequest } from "@/lib/api/server";

export async function addClient(input: unknown): Promise<ActionResult<ClientDto>> {
  const result = await runAction(createClientSchema, input, (data) => apiRequest<ClientDto>("/clients", { method: "POST", body: data }));
  if (result.ok) revalidatePath("/clients");
  return result;
}
