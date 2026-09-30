import type { MaterialListDto, SupplierDto } from "@sijaf/shared";
import type { Metadata } from "next";
import { SupplierDetail } from "@/components/features/catalog/supplier-detail";
import { SupplierList } from "@/components/features/catalog/supplier-list";
import { SuppliersEmpty } from "@/components/features/catalog/suppliers-empty";
import { apiRequest } from "@/lib/api/server";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "الموردين · كتالوج الأسعار" };

export default async function SuppliersPage({ searchParams }: PageProps<"/catalog/suppliers">) {
  const { supplier: param } = await searchParams;
  const suppliers = await apiRequest<SupplierDto[]>("/suppliers");
  if (suppliers.length === 0) return <SuppliersEmpty />;

  const requested = typeof param === "string" ? suppliers.find((s) => s.id === param) : undefined;
  // على اللابتوب والتابلت أول مورد بيتفتح؛ على الموبايل القايمة الأول
  const selected = requested ?? suppliers[0];
  const materials = await apiRequest<MaterialListDto>(`/materials?suppliers=${selected.id}&pageSize=100`);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div className={cn(requested && "max-md:hidden")}>
        <SupplierList suppliers={suppliers} selectedId={selected.id} />
      </div>
      <div className={cn(!requested && "max-md:hidden")}>
        <SupplierDetail
          supplier={selected}
          materials={materials.items}
          suppliers={suppliers.map(({ id, name }) => ({ id, name }))}
        />
      </div>
    </div>
  );
}
