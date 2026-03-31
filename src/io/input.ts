/**
 * Input readers — CSV file and stdin/pipe.
 * Both return arrays of key-value records for batch processing.
 */

import { readFileSync } from "fs";

export interface InputRecord {
  [key: string]: string;
}

/**
 * Read a CSV file and return rows as key-value objects.
 * First row is treated as headers.
 */
export function readCsvFile(filePath: string): InputRecord[] {
  const content = readFileSync(filePath, "utf-8").trim();
  const lines = content.split("\n").map((l) => l.replace(/\r$/, ""));

  if (lines.length < 2) {
    throw new Error(`CSV file has no data rows: ${filePath}`);
  }

  const headers = parseCsvLine(lines[0]);
  const records: InputRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "") continue;
    const values = parseCsvLine(lines[i]);
    const record: InputRecord = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j] ?? "";
    }
    records.push(record);
  }

  return records;
}

/**
 * Read stdin and return parsed records.
 * Supports: JSON array, newline-delimited JSON, or plain newline-delimited values.
 */
export async function readStdin(): Promise<InputRecord[]> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf-8").trim();

  if (!raw) return [];

  // Try JSON array first
  if (raw.startsWith("[")) {
    const parsed = JSON.parse(raw) as unknown[];
    return parsed.map(normalizeInput);
  }

  // Try newline-delimited JSON
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines[0].startsWith("{")) {
    return lines.map((line) => JSON.parse(line) as InputRecord);
  }

  // Plain values — treat as a single-column input with key "value"
  return lines.map((line) => ({ value: line }));
}

function normalizeInput(item: unknown): InputRecord {
  if (typeof item === "string") return { value: item };
  if (typeof item === "object" && item !== null) {
    const record: InputRecord = {};
    for (const [k, v] of Object.entries(item)) {
      record[k] = String(v);
    }
    return record;
  }
  return { value: String(item) };
}

/**
 * Parse a single CSV line respecting quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current);
  return fields;
}
