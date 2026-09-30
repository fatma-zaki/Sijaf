"use client";

import { ChevronLeft, FileSpreadsheet, ListChecks, PencilLine } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonStyles } from "@/components/ui/button";
import { ChoiceCard } from "@/components/ui/choice-card";
import { InfoNote } from "@/components/ui/info-note";
import { StatusBadge } from "@/components/ui/status-badge";

type PriceMethod = "excel" | "manual" | "template";

const methods = [
  {
    id: "excel",
    icon: <FileSpreadsheet aria-hidden />,
    title: "استيراد من Excel",
    description: "عندك الأسعار في شيت؟ ارفعه وإحنا نرتب الأعمدة.",
    badge: <StatusBadge tone="brand">الأسرع</StatusBadge>,
  },
  {
    id: "manual",
    icon: <PencilLine aria-hidden />,
    title: "إدخال يدوي",
    description: "ضيف الخامات واحدة واحدة بسعر الشراء والبيع.",
  },
  {
    id: "template",
    icon: <ListChecks aria-hidden />,
    title: "ابدأ بأسعار نموذجية",
    description: "قائمة جاهزة بأشهر الخامات، وعدّل أسعارها لأسعارك.",
  },
] as const satisfies readonly { id: PriceMethod; [key: string]: unknown }[];

export function PricesStep() {
  const [method, setMethod] = useState<PriceMethod>("excel");

  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:gap-4">
        {methods.map((item) => (
          <ChoiceCard
            key={item.id}
            icon={item.icon}
            title={item.title}
            description={item.description}
            badge={"badge" in item ? item.badge : undefined}
            selected={method === item.id}
            onSelect={() => setMethod(item.id)}
          />
        ))}
      </div>
      <InfoNote>
        الكتالوج (الاستيراد من Excel والأسعار النموذجية والإدخال اليدوي) جاي في المرحلة 3. تقدر تكمّل دلوقتي وترجع
        للخطوة دي من الرئيسية.
      </InfoNote>
      <div className="mt-auto flex items-center justify-between gap-3">
        <Link href="/onboarding/models" className={buttonStyles({ size: "lg", className: "min-w-45" })}>
          متابعة
          <ChevronLeft aria-hidden />
        </Link>
        <Link href="/onboarding/shop" className={buttonStyles({ variant: "secondary", size: "lg" })}>
          رجوع
        </Link>
      </div>
    </>
  );
}
