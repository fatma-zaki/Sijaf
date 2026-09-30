import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DataTableColumn<Row> = {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  /** رقم أو سعر: غامق ومايتكسرش على سطرين */
  numeric?: boolean;
  className?: string;
};

type DataTableProps<Row> = {
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
  label: string;
  className?: string;
};

export function DataTable<Row>({ columns, rows, getRowKey, label, className }: DataTableProps<Row>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table aria-label={label} className="w-full border-collapse text-base">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className="whitespace-nowrap border-b border-border bg-surface-subtle px-4 py-2.5 text-start text-xs font-medium text-ink-muted"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="group">
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={cn(
                    "border-b border-border px-4 py-3 text-ink-2 group-last:border-b-0",
                    column.numeric && "whitespace-nowrap font-semibold text-ink",
                    column.className,
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
