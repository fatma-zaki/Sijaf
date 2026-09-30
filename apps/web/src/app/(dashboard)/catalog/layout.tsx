import type { CatalogCountsDto } from "@sijaf/shared";
import { CatalogTabs } from "@/components/features/catalog/catalog-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { apiRequest } from "@/lib/api/server";
import { requireOwner } from "@/lib/auth/session";

export default async function CatalogLayout({ children }: LayoutProps<"/catalog">) {
  await requireOwner();
  const counts = await apiRequest<CatalogCountsDto>("/catalog/counts");
  return (
    <>
      <PageHeader
        title="كتالوج الأسعار"
        subtitle={<span className="hidden md:inline">كل عرض سعر بيتحسب من الأسعار دي، وكل خامة مربوطة بالمورد بتاعها</span>}
        backHref="/more"
      />
      <CatalogTabs counts={counts} />
      {children}
    </>
  );
}
