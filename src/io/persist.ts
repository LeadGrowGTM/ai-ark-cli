/**
 * Auto-persistence module — writes results to ~/.ai-ark/results/ by default.
 * Every data command calls persistResults() before formatOutput() so that
 * piped output does not skip the auto-save copy.
 *
 * Stderr convention: `Saved: <absolute path>` — never stdout.
 */

import { mkdirSync, writeFileSync } from "fs";
import { homedir } from "os";
import { dirname, resolve } from "path";

export interface PersistOptions {
  data: unknown;
  command: string; // e.g. "people-search", "people-export"
  output?: string; // explicit --output path, overrides default
  noSave?: boolean; // --no-save flag
}

/**
 * Build the default timestamped path under ~/.ai-ark/results/.
 * Format: YYYY-MM-DD_HH-MM_<command>.json (local time, year-first for sortability).
 * Exported so callers can unit-test the path shape without writing to disk.
 */
export function buildDefaultPath(command: string, now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `_${pad(now.getHours())}-${pad(now.getMinutes())}`;
  return resolve(homedir(), ".ai-ark", "results", `${ts}_${command}.json`);
}

/**
 * Write results to disk and return the absolute path written (or null if noSave).
 *
 * Resolution order:
 * 1. Explicit --output path always wins (even if --no-save was also passed).
 * 2. --no-save with no --output → write nothing, return null.
 * 3. Default: ~/.ai-ark/results/YYYY-MM-DD_HH-MM_<command>.json.
 *
 * The target directory is created automatically (recursive mkdir, no-op if exists).
 */
export function persistResults(opts: PersistOptions): string | null {
  const target = opts.output
    ? resolve(opts.output)
    : opts.noSave
      ? null
      : buildDefaultPath(opts.command);

  if (!target) return null;

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(opts.data, null, 2), "utf-8");
  process.stderr.write(`Saved: ${target}\n`);
  return target;
}
