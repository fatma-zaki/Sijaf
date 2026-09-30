"use server";

import {
  curtainModelSchema,
  materialImportSchema,
  materialSchema,
  supplierSchema,
  type CurtainModelDto,
  type MaterialDto,
  type MaterialImportResult,
  type SupplierDto,
  type TemplateApplyResult,
} from "@sijaf/shared";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction } from "@/lib/actions";
import type { ActionResult } from "@/lib/action-result";
import { apiRequest } from "@/lib/api/server";

const optionalId = z.uuid().nullable();

/** أي تعديل في الكتالوج بيأثر على كل صفحاته وعلى الرئيسية (خطوات التجهيز) */
function refresh() {
  revalidatePath("/", "layout");
}

async function done<T>(result: ActionResult<T>): Promise<ActionResult<T>> {
  if (result.ok) refresh();
  return result;
}

export async function saveMaterial(id: string | null, input: unknown): Promise<ActionResult<MaterialDto>> {
  const target = optionalId.parse(id);
  return done(
    await runAction(materialSchema, input, (data) =>
      apiRequest<MaterialDto>(target ? `/materials/${target}` : "/materials", { method: target ? "PATCH" : "POST", body: data }),
    ),
  );
}

export async function deleteMaterial(id: string): Promise<ActionResult> {
  return done(await runAction(z.uuid(), id, (target) => apiRequest<void>(`/materials/${target}`, { method: "DELETE" })));
}

export async function importMaterials(input: unknown): Promise<ActionResult<MaterialImportResult>> {
  return done(
    await runAction(materialImportSchema, input, (data) =>
      apiRequest<MaterialImportResult>("/materials/import", { method: "POST", body: data }),
    ),
  );
}

export async function applyTemplate(): Promise<ActionResult<TemplateApplyResult>> {
  return done(
    await runAction(z.undefined(), undefined, () => apiRequest<TemplateApplyResult>("/catalog/template", { method: "POST" })),
  );
}

export async function saveSupplier(id: string | null, input: unknown): Promise<ActionResult<SupplierDto>> {
  const target = optionalId.parse(id);
  return done(
    await runAction(supplierSchema, input, (data) =>
      apiRequest<SupplierDto>(target ? `/suppliers/${target}` : "/suppliers", { method: target ? "PATCH" : "POST", body: data }),
    ),
  );
}

export async function deleteSupplier(id: string): Promise<ActionResult> {
  return done(await runAction(z.uuid(), id, (target) => apiRequest<void>(`/suppliers/${target}`, { method: "DELETE" })));
}

export async function saveModel(id: string | null, input: unknown): Promise<ActionResult<CurtainModelDto>> {
  const target = optionalId.parse(id);
  return done(
    await runAction(curtainModelSchema, input, (data) =>
      apiRequest<CurtainModelDto>(target ? `/models/${target}` : "/models", { method: target ? "PATCH" : "POST", body: data }),
    ),
  );
}

export async function deleteModel(id: string): Promise<ActionResult> {
  return done(await runAction(z.uuid(), id, (target) => apiRequest<void>(`/models/${target}`, { method: "DELETE" })));
}

export async function addDefaultModels(): Promise<ActionResult<CurtainModelDto[]>> {
  return done(
    await runAction(z.undefined(), undefined, () => apiRequest<CurtainModelDto[]>("/models/defaults", { method: "POST" })),
  );
}
