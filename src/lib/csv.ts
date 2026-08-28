function safeCell(value: string | number | boolean | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (typeof value === "string" && /^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function createCsv(
  headers: Array<string>,
  rows: Array<Array<string | number | boolean | null | undefined>>,
): string {
  return `\uFEFF${[headers, ...rows]
    .map((row) => row.map(safeCell).join(","))
    .join("\r\n")}\r\n`;
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename.replaceAll('"', "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
