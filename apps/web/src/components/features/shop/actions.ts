"use server";

import {
  createTechnicianSchema,
  onboardingStepSchema,
  shopProfileSchema,
  updateTechnicianSchema,
  type ShopDto,
  type UserDto,
} from "@sijaf/shared";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction } from "@/lib/actions";
import type { ActionResult } from "@/lib/action-result";
import { apiRequest } from "@/lib/api/server";

export async function updateShopProfile(input: unknown): Promise<ActionResult<ShopDto>> {
  const result = await runAction(shopProfileSchema, input, (data) =>
    apiRequest<ShopDto>("/shop", { method: "PATCH", body: data }),
  );
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

export async function completeOnboardingStep(step: unknown): Promise<ActionResult<ShopDto>> {
  const result = await runAction(onboardingStepSchema, step, (data) =>
    apiRequest<ShopDto>(`/shop/onboarding/steps/${data}`, { method: "POST" }),
  );
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

export async function dismissOnboarding(): Promise<ActionResult<ShopDto>> {
  const result = await runAction(z.undefined(), undefined, () =>
    apiRequest<ShopDto>("/shop/onboarding/dismiss", { method: "POST" }),
  );
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

export async function addTechnician(input: unknown): Promise<ActionResult<UserDto>> {
  const result = await runAction(createTechnicianSchema, input, (data) =>
    apiRequest<UserDto>("/users", { method: "POST", body: data }),
  );
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

const updateInput = z.object({ id: z.uuid(), changes: updateTechnicianSchema });

export async function updateTechnician(input: unknown): Promise<ActionResult<UserDto>> {
  const result = await runAction(updateInput, input, ({ id, changes }) =>
    apiRequest<UserDto>(`/users/${id}`, { method: "PATCH", body: changes }),
  );
  if (result.ok) revalidatePath("/", "layout");
  return result;
}
