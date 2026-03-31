/**
 * Clay table push — sends results to a Clay table via Clay CLI.
 * Requires `clay` CLI to be installed and authenticated.
 */

import { spawnSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

/**
 * Push an array of records to a Clay table.
 * Writes to a temp CSV, then calls `clay rows add --table <id> --file <csv>`.
 */
export function pushToClay(tableId: string, data: unknown[]): void {
  if (data.length === 0) {
    process.stderr.write("No data to push to Clay\n");
    return;
  }

  // Flatten records for CSV
  const rows = data.map((item) =>
    flattenForClay(item as Record<string, unknown>),
  );
  const columns = [...new Set(rows.flatMap(Object.keys))];

  // Write temp CSV
  const tmpPath = join(tmpdir(), `ai-ark-clay-${Date.now()}.csv`);
  const csvLines = [
    columns.map(csvEscape).join(","),
    ...rows.map((row) =>
      columns.map((col) => csvEscape(row[col] ?? "")).join(","),
    ),
  ];
  writeFileSync(tmpPath, csvLines.join("\n"), "utf-8");

  try {
    process.stderr.write(`Pushing ${data.length} rows to Clay table ${tableId}...\n`);

    const result = spawnSync("clay", ["rows", "add", "--table", tableId, "--file", tmpPath], {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf-8",
    });

    if (result.status !== 0) {
      const err = result.stderr || result.stdout || "Unknown error";
      throw new Error(`Clay push failed: ${err.trim()}`);
    }

    process.stderr.write(`Pushed ${data.length} rows to Clay table ${tableId}\n`);
  } finally {
    try {
      unlinkSync(tmpPath);
    } catch {
      // Temp file cleanup is best-effort
    }
  }
}

function flattenForClay(
  obj: Record<string, unknown>,
  prefix = "",
  depth = 0,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (depth > 2) return result;

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === undefined) {
      result[fullKey] = "";
    } else if (Array.isArray(value)) {
      result[fullKey] = value.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join("; ");
    } else if (typeof value === "object") {
      Object.assign(result, flattenForClay(value as Record<string, unknown>, fullKey, depth + 1));
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
