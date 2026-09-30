import { layerLabels, materialLayers, type MaterialLayer, type MaterialListDto } from "@sijaf/shared";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { allLayersIcon, layerIcons } from "./layer-icons";

type LayerFilterProps = {
  facets: MaterialListDto["facets"];
  current: MaterialLayer | undefined;
  /** الـ query الحالي من غير layer وpage */
  baseQuery: URLSearchParams;
};

function hrefFor(baseQuery: URLSearchParams, layer: MaterialLayer | null): string {
  const params = new URLSearchParams(baseQuery);
  if (layer) params.set("layer", layer);
  const query = params.toString();
  return query ? `/catalog/materials?${query}` : "/catalog/materials";
}

/** فلتر الطبقة في الجنب (لابتوب): لينكات عشان يشتغل من غير JS ويتحفظ في الـ URL */
export function LayerFilter({ facets, current, baseQuery }: LayerFilterProps) {
  const items = [
    { layer: null, label: "الكل", count: facets.all, Icon: allLayersIcon },
    // الطبقات الفاضية مابتظهرش إلا لو هي المختارة
    ...materialLayers
      .filter((layer) => facets.layers[layer] > 0 || layer === current)
      .map((layer) => ({ layer, label: layerLabels[layer], count: facets.layers[layer], Icon: layerIcons[layer] })),
  ];

  return (
    <nav aria-label="الطبقة" className="flex flex-col gap-0.5 rounded-lg border border-border bg-surface px-3 py-4 shadow-card">
      <h2 className="m-0 px-3 pb-2 text-md font-bold text-ink">الطبقة</h2>
      {items.map(({ layer, label, count, Icon }) => {
        const active = (layer ?? undefined) === current;
        return (
          <Link
            key={label}
            href={hrefFor(baseQuery, layer)}
            aria-current={active ? "true" : undefined}
            scroll={false}
            className={cn(
              "flex h-11 items-center gap-2.5 rounded-sm px-3 no-underline",
              active ? "bg-primary-soft font-semibold text-primary hover:text-primary" : "font-medium text-ink-2 hover:bg-surface-subtle hover:text-ink",
            )}
          >
            <Icon aria-hidden className="size-4.5 flex-none" />
            <span className="grow">{label}</span>
            <span className="text-xs text-ink-muted">{count}</span>
          </Link>
        );
      })}
    </nav>
  );
}
