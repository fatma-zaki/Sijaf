import { materialLayers, type MaterialLayer, type MaterialListDto, type SupplierDto } from "@sijaf/shared";
import type { Metadata } from "next";
import { CatalogEmpty } from "@/components/features/catalog/catalog-empty";
import { LayerFilter } from "@/components/features/catalog/layer-filter";
import { MaterialsFilterChips, MaterialsToolbar } from "@/components/features/catalog/materials-toolbar";
import { MaterialsView } from "@/components/features/catalog/materials-view";
import { SupplierFilter } from "@/components/features/catalog/supplier-filter";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { apiRequest } from "@/lib/api/server";
import { SearchX } from "lucide-react";

export const metadata: Metadata = { title: "الخامات · كتالوج الأسعار" };

const FILTER_KEYS = ["q", "layer", "tier", "suppliers"] as const;
const PAGE_SIZE = 12;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MaterialsPage({ searchParams }: PageProps<"/catalog/materials">) {
  const raw = await searchParams;
  const filters = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = first(raw[key]);
    if (value) filters.set(key, value);
  }
  const page = Math.max(1, Number(first(raw.page)) || 1);

  const query = new URLSearchParams(filters);
  query.set("page", String(page));
  query.set("pageSize", String(PAGE_SIZE));
  const [list, suppliers] = await Promise.all([
    apiRequest<MaterialListDto>(`/materials?${query}`),
    apiRequest<SupplierDto[]>("/suppliers"),
  ]);
  const supplierOptions = suppliers.map(({ id, name }) => ({ id, name }));

  if (list.facets.all === 0 && !filters.has("q") && !filters.has("tier")) {
    return <CatalogEmpty suppliers={supplierOptions} />;
  }

  const layerParam = filters.get("layer");
  const layer = materialLayers.find((value): value is MaterialLayer => value === layerParam);
  const withoutLayer = new URLSearchParams(filters);
  withoutLayer.delete("layer");

  const pageHref = (target: number) => {
    const params = new URLSearchParams(filters);
    if (target > 1) params.set("page", String(target));
    return `/catalog/materials${params.size ? `?${params}` : ""}`;
  };
  const shownTo = Math.min(page * PAGE_SIZE, list.total);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden flex-col gap-4 lg:flex">
        <LayerFilter facets={list.facets} current={layer} baseQuery={withoutLayer} />
        <SupplierFilter suppliers={list.facets.suppliers} />
      </aside>

      <Card className="flex min-w-0 flex-col gap-0 p-0">
        <div className="flex flex-col gap-4 p-4 md:p-5">
          <MaterialsToolbar suppliers={supplierOptions} />
          <MaterialsFilterChips facets={list.facets} />
        </div>
        {list.items.length > 0 ? (
          <>
            <MaterialsView items={list.items} suppliers={supplierOptions} />
            <Pagination
              className="border-t border-border"
              summary={`عرض ${shownTo} من ${list.total} خامة`}
              previousHref={page > 1 ? pageHref(page - 1) : undefined}
              nextHref={shownTo < list.total ? pageHref(page + 1) : undefined}
            />
          </>
        ) : (
          <EmptyState icon={<SearchX aria-hidden />} title="مفيش خامات بالفلاتر دي" description="جرّب كلمة تانية أو شيل الفلاتر." />
        )}
      </Card>
    </div>
  );
}
