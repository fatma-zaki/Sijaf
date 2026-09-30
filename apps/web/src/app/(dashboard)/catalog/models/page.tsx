import type { CurtainModelDto, MaterialDto } from "@sijaf/shared";
import type { Metadata } from "next";
import { AddDefaultModels } from "@/components/features/catalog/models/add-default-models";
import { ModelEditor } from "@/components/features/catalog/models/model-editor";
import { ModelList } from "@/components/features/catalog/models/model-list";
import { apiRequest } from "@/lib/api/server";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "الموديلات · كتالوج الأسعار" };

export default async function ModelsPage({ searchParams }: PageProps<"/catalog/models">) {
  const { model: param } = await searchParams;
  const [models, materials] = await Promise.all([
    apiRequest<CurtainModelDto[]>("/models"),
    apiRequest<MaterialDto[]>("/materials/options"),
  ]);

  const creating = param === "new";
  if (models.length === 0 && !creating) return <AddDefaultModels />;

  const requested = typeof param === "string" && !creating ? models.find((model) => model.id === param) : undefined;
  const selected = creating ? undefined : (requested ?? models[0]);
  // على الموبايل القايمة الأول، والمحرر لما تختار موديل
  const showEditorOnMobile = creating || requested !== undefined;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className={cn(showEditorOnMobile && "max-md:hidden")}>
        <ModelList models={models} selectedId={selected?.id ?? null} />
      </div>
      <div className={cn(!showEditorOnMobile && "max-md:hidden")}>
        {/* key: الفورم يبدأ من جديد لما الموديل المختار يتغير */}
        <ModelEditor key={selected?.id ?? "new"} model={selected} materials={materials} />
      </div>
    </div>
  );
}
