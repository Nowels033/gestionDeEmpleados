export interface ParsedCsvRow {
  [header: string]: string;
}

export interface ParseCsvResult {
  headers: string[];
  rows: ParsedCsvRow[];
}

export function normalizeCsvHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseCsvCells(csvContent: string): string[][] {
  const content = csvContent.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (inQuotes) {
      if (char === '"') {
        const nextChar = content[index + 1];
        if (nextChar === '"') {
          field += '"';
          index += 1;
          continue;
        }

        inQuotes = false;
        continue;
      }

      field += char;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function parseCsv(csvContent: string): ParseCsvResult {
  const parsedRows = parseCsvCells(csvContent);

  if (parsedRows.length === 0) {
    return { headers: [], rows: [] };
  }

  const normalizedHeaders = parsedRows[0].map((headerCell) => normalizeCsvHeader(headerCell));

  const rows = parsedRows
    .slice(1)
    .filter((cells) => cells.some((cell) => cell.trim() !== ""))
    .map((cells) => {
      const record: ParsedCsvRow = {};

      normalizedHeaders.forEach((header, index) => {
        if (!header) {
          return;
        }

        record[header] = cells[index]?.trim() ?? "";
      });

      return record;
    });

  return {
    headers: normalizedHeaders.filter(Boolean),
    rows,
  };
}
