"use client";

import type { CatalogCountsDto } from "@sijaf/shared";
import { usePathname } from "next/navigation";
import { TabNav } from "@/components/ui/tab-nav";

const tabs = [
  { href: "/catalog/materials", label: "الخامات", key: "materials" },
  { href: "/catalog/suppliers", label: "الموردين", key: "suppliers" },
  { href: "/catalog/models", label: "الموديلات", key: "models" },
] as const;

export function CatalogTabs({ counts }: { counts: CatalogCountsDto }) {
  const pathname = usePathname();
  return (
    <TabNav
      label="أقسام الكتالوج"
      items={tabs.map((tab) => ({
        href: tab.href,
        label: tab.label,
        count: counts[tab.key],
        current: pathname.startsWith(tab.href),
      }))}
    />
  );
}
