export interface CsvColumn<T> {
  key: keyof T | string;
  header: string;
  map?: (row: T) => string | number | null | undefined;
}

function normalizeCellValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const raw = String(value);
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function downloadCsv<T>(
  rows: T[],
  columns: CsvColumn<T>[],
  filename: string
): void {
  const headerLine = columns.map((column) => normalizeCellValue(column.header)).join(",");

  const bodyLines = rows.map((row) =>
    columns
      .map((column) => {
        if (column.map) {
          return normalizeCellValue(column.map(row));
        }

        const key = column.key as keyof T;
        return normalizeCellValue(row[key] as string | number | null | undefined);
      })
      .join(",")
  );

  const csv = [headerLine, ...bodyLines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
