"use client";

import type { MaterialImportResult } from "@sijaf/shared";
import { ArrowLeft, CircleCheck, FileSpreadsheet, TriangleAlert, Upload } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { InfoNote } from "@/components/ui/info-note";
import { StatusBadge } from "@/components/ui/status-badge";
import { UploadDrop } from "@/components/ui/upload-drop";
import { importMaterials } from "../actions";
import {
  buildImportRows,
  detectMapping,
  fieldLabels,
  findHeaderRow,
  importFields,
  missingRequired,
  requiredFields,
  type Cell,
  type ColumnMapping,
} from "./mapping";
import { TemplateDownload } from "./template-download";

type LoadedSheet = { fileName: string; rows: Cell[][]; headerRow: number };

/** read-excel-file بيرجّع أنواع أوسع من اللي بنحتاجه */
function toCell(value: unknown): Cell {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value instanceof Date) return value;
  return String(value);
}

const MAX_ERRORS_SHOWN = 5;

type ExcelImportProps = {
  /** لو الشيت مالوش عمود مورد (تحديث أسعار مورد معيّن) */
  fallbackSupplier?: string | null;
  onImported?: (result: MaterialImportResult) => void;
};

/** رفع شيت ← مطابقة الأعمدة ← استيراد (زي شاشة تجهيز المحل) */
export function ExcelImport({ fallbackSupplier = null, onImported }: ExcelImportProps) {
  const [sheet, setSheet] = useState<LoadedSheet | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>([]);
  const [readError, setReadError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [result, setResult] = useState<MaterialImportResult | null>(null);
  const [pending, startTransition] = useTransition();

  const load = async (file: File) => {
    setReadError(null);
    setResult(null);
    if (!/\.xlsx$/i.test(file.name)) {
      setReadError("الملف لازم يبقى Excel بامتداد ‎.xlsx‎. لو معاك ‎.xls‎ أو CSV احفظه من Excel بصيغة ‎.xlsx‎.");
      return;
    }
    try {
      const { readSheet } = await import("read-excel-file/browser");
      const data = await readSheet(file);
      const rows = data.map((row) => row.map(toCell));
      const headerRow = findHeaderRow(rows);
      setSheet({ fileName: file.name, rows, headerRow });
      setMapping(detectMapping(rows[headerRow] ?? []));
    } catch {
      setReadError("مش قادرين نقرا الملف ده. اتأكد إنه شيت Excel سليم.");
    }
  };

  const parsed = useMemo(
    () => (sheet ? buildImportRows(sheet.rows, sheet.headerRow, mapping, fallbackSupplier) : null),
    [sheet, mapping, fallbackSupplier],
  );
  const missing = missingRequired(mapping);

  const runImport = () => {
    if (!parsed || parsed.rows.length === 0) return;
    setImportError(null);
    startTransition(async () => {
      const response = await importMaterials({ rows: parsed.rows });
      if (!response.ok) return setImportError(response.message);
      setResult(response.data);
      onImported?.(response.data);
    });
  };

  if (result) {
    return (
      <InfoNote tone="success">
        اتضاف {result.created} صنف واتحدّث {result.updated}
        {result.suppliersCreated > 0 && ` · ${result.suppliersCreated} مورد جديد`}
      </InfoNote>
    );
  }

  if (!sheet) {
    return (
      <div className="flex flex-col gap-3">
        <UploadDrop
          title="ارفع شيت الأسعار"
          buttonLabel="اختار ملف Excel"
          hint="‎.xlsx‎ · أول صف فيه أسماء الأعمدة"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onFiles={([file]) => file && load(file)}
        />
        <FormError message={readError ?? undefined} />
        <TemplateDownload className="self-start" />
      </div>
    );
  }

  const headers = sheet.rows[sheet.headerRow] ?? [];
  const summary = parsed ? `${parsed.rows.length} صنف · ${parsed.suppliers} ${parsed.suppliers === 1 ? "مورد" : "موردين"}` : "";

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-sm bg-success-soft text-success">
            <FileSpreadsheet aria-hidden className="size-5" />
          </span>
          <div className="flex flex-col">
            <span className="font-semibold text-ink" dir="auto">
              {sheet.fileName}
            </span>
            <span className="text-xs text-ink-muted">{summary}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TemplateDownload />
          <Button variant="secondary" size="sm" onClick={() => setSheet(null)}>
            تغيير الملف
          </Button>
        </div>
      </div>

      <div className="px-5 pb-1.5 pt-3.5">
        <h3 className="m-0 text-md font-bold text-ink">طابق أعمدة الشيت</h3>
        <span className="text-xs text-ink-muted">اتعرفنا على الأعمدة تلقائي، راجعها قبل ما تكمّل</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-base">
          <thead>
            <tr>
              <th scope="col" className="border-b border-border bg-surface-subtle px-4 py-2.5 text-start text-xs font-medium text-ink-muted">
                العمود في الشيت
              </th>
              <th scope="col" className="border-b border-border bg-surface-subtle px-2 py-2.5">
                <span className="sr-only">يتحط في</span>
              </th>
              <th scope="col" className="border-b border-border bg-surface-subtle px-4 py-2.5 text-start text-xs font-medium text-ink-muted">
                الحقل في سِجاف
              </th>
              <th scope="col" className="border-b border-border bg-surface-subtle px-4 py-2.5">
                <span className="sr-only">الحالة</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {headers.map((header, column) => {
              const title = header === null || header === undefined || header === "" ? `عمود ${column + 1}` : String(header);
              const field = mapping[column] ?? "ignore";
              return (
                <tr key={column}>
                  <td className="border-b border-border px-4 py-2.5 font-medium text-ink">{title}</td>
                  <td className="border-b border-border px-2 text-ink-muted">
                    <ArrowLeft aria-hidden className="size-4" />
                  </td>
                  <td className="border-b border-border px-4 py-2">
                    <Select
                      aria-label={`الحقل للعمود ${title}`}
                      value={field}
                      className="h-9 min-w-40"
                      onChange={(event) => {
                        const value = event.target.value as ColumnMapping[number];
                        // الحقل مايتطابقش مع عمودين
                        setMapping((current) =>
                          current.map((existing, index) => (index === column ? value : existing === value && value !== "ignore" ? "ignore" : existing)),
                        );
                      }}
                    >
                      {importFields.map((option) => (
                        <option key={option} value={option}>
                          {fieldLabels[option]}
                        </option>
                      ))}
                      <option value="ignore">{fieldLabels.ignore}</option>
                    </Select>
                  </td>
                  <td className="border-b border-border px-4">
                    {field === "ignore" ? (
                      <StatusBadge tone="neutral">مش مطلوب</StatusBadge>
                    ) : (
                      <StatusBadge tone="success" icon={<CircleCheck aria-hidden />}>
                        اتطابق
                      </StatusBadge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 p-5">
        {missing.length > 0 && (
          <InfoNote tone="warning">
            لازم تطابق عمود لـ {missing.map((field) => `«${fieldLabels[field]}»`).join(" و")}. الحقول المطلوبة:{" "}
            {requiredFields.map((field) => fieldLabels[field]).join("، ")}.
          </InfoNote>
        )}
        {missing.length === 0 && parsed && parsed.errors.length > 0 && (
          <div role="note" className="flex flex-col gap-1 rounded-md bg-warning-soft px-4 py-3 text-sm text-warning-fg">
            <span className="flex items-center gap-2 font-semibold">
              <TriangleAlert aria-hidden className="size-4 text-warning" />
              {parsed.errors.length} صف فيهم مشاكل وهيتجاهلوا
            </span>
            <ul className="m-0 list-none p-0">
              {parsed.errors.slice(0, MAX_ERRORS_SHOWN).map((error) => (
                <li key={error.row}>
                  صف {error.row}: {error.message}
                </li>
              ))}
              {parsed.errors.length > MAX_ERRORS_SHOWN && <li>و{parsed.errors.length - MAX_ERRORS_SHOWN} غيرهم…</li>}
            </ul>
          </div>
        )}
        <FormError message={importError ?? undefined} />
        <div>
          <Button size="lg" onClick={runImport} disabled={pending || missing.length > 0 || !parsed || parsed.rows.length === 0} className="min-w-45">
            {pending ? "بنستورد..." : `استيراد ${parsed?.rows.length ?? 0} صنف`}
            <Upload aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
