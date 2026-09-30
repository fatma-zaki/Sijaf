"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { fieldLabels, importFields } from "./mapping";

const exampleRows = [
  ["شيفون لينين", "شيفون", "لينين", "متوسط", "الأناضول للأقمشة", "CH-110", 215, 290, "متر", 3],
  ["قطيفة تركي", "قماش أساسي", "قطيفة", "متوسط", "الأناضول للأقمشة", "VT-208", 415, 560, "متر", 3],
  ["مجرى ألومنيوم", "مجاري وكرانيش", "مجرى", "اقتصادي", "الأمل للمجاري والإكسسوارات", "", 120, 160, "متر طولي", ""],
];

/** «تحميل نموذج الشيت»: ملف Excel بالأعمدة اللي سِجاف بيفهمها وتلات أمثلة */
export function TemplateDownload({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const { default: writeXlsxFile } = await import("write-excel-file/browser");
      const header = importFields.map((field) => ({ value: fieldLabels[field], fontWeight: "bold" as const }));
      await writeXlsxFile([header, ...exampleRows], {
        rightToLeft: true,
        columns: importFields.map((field) => ({ width: field === "name" || field === "supplierName" ? 28 : 14 })),
      }).toFile("نموذج أسعار سجاف.xlsx");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      className={cn("inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-link hover:text-primary disabled:opacity-60", className)}
    >
      {busy ? "بنجهّز الملف..." : "تحميل نموذج الشيت"}
    </button>
  );
}
