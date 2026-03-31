/**
 * Output formatters — JSON (default), CSV, and table.
 * All formatters write to stdout.
 */

export type OutputFormat = "json" | "csv" | "table";

/**
 * Format and output data based on the selected format.
 * Handles both arrays and single objects.
 */
export function formatOutput(data: unknown, format: OutputFormat): void {
  if (format === "json") {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const rows = Array.isArray(data) ? data : [data];
  if (rows.length === 0) {
    if (format === "csv") console.log("");
    else console.log("(no results)");
    return;
  }

  // Flatten nested objects for CSV/table display
  const flatRows = rows.map((row) => flattenObject(row as Record<string, unknown>));
  const columns = [...new Set(flatRows.flatMap(Object.keys))];

  if (format === "csv") {
    outputCsv(flatRows, columns);
  } else {
    outputTable(flatRows, columns);
  }
}

function outputCsv(rows: Record<string, string>[], columns: string[]): void {
  // Header
  console.log(columns.map(csvEscape).join(","));
  // Rows
  for (const row of rows) {
    console.log(columns.map((col) => csvEscape(row[col] ?? "")).join(","));
  }
}

function outputTable(rows: Record<string, string>[], columns: string[]): void {
  // Calculate column widths
  const widths: Record<string, number> = {};
  for (const col of columns) {
    widths[col] = col.length;
  }
  for (const row of rows) {
    for (const col of columns) {
      const val = row[col] ?? "";
      widths[col] = Math.max(widths[col], val.length);
    }
  }

  // Cap column widths at 40 chars for readability
  for (const col of columns) {
    widths[col] = Math.min(widths[col], 40);
  }

  // Header
  const header = columns.map((col) => col.padEnd(widths[col])).join("  ");
  console.log(header);
  console.log(columns.map((col) => "─".repeat(widths[col])).join("  "));

  // Rows
  for (const row of rows) {
    const line = columns
      .map((col) => {
        const val = row[col] ?? "";
        return val.length > widths[col]
          ? val.slice(0, widths[col] - 1) + "…"
          : val.padEnd(widths[col]);
      })
      .join("  ");
    console.log(line);
  }

  console.error(`\n${rows.length} result${rows.length === 1 ? "" : "s"}`);
}

/**
 * Flatten a nested object into dot-notation keys with string values.
 * e.g. { profile: { first_name: "John" } } → { "profile.first_name": "John" }
 */
function flattenObject(
  obj: Record<string, unknown>,
  prefix = "",
  depth = 0,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (depth > 3) return result; // Don't go too deep

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      result[fullKey] = "";
    } else if (Array.isArray(value)) {
      result[fullKey] = value
        .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
        .join("; ");
    } else if (typeof value === "object") {
      Object.assign(result, flattenObject(value as Record<string, unknown>, fullKey, depth + 1));
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
