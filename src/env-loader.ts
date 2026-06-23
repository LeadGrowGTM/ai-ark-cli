/**
 * .env discovery and loading logic for the AI Ark CLI.
 *
 * Extracted from index.ts so it can be unit-tested without spawning the CLI.
 * Search order: CLI's own directory, then CWD. No hardcoded user paths.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

/**
 * Load key=value pairs from `<dir>/.env` into `env`.
 * Existing keys are not overwritten (first writer wins).
 * Returns true if the file was found and read, false otherwise.
 */
export function loadEnvFile(dir: string, env: Record<string, string>): boolean {
  try {
    const p = resolve(dir, ".env");
    const lines = readFileSync(p, "utf-8").replace(/\r/g, "").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
      if (match && !(match[1] in env)) {
        let val = match[2];
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        env[match[1]] = val;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Try each directory in order; stop after the first successful load.
 * Returns the full list of directories searched (for error reporting).
 */
export function loadEnvFromDirs(
  dirs: string[],
  env: Record<string, string>,
): string[] {
  const searched: string[] = [];
  for (const dir of dirs) {
    searched.push(dir);
    if (loadEnvFile(dir, env)) break;
  }
  return searched;
}

/**
 * Default search directories for the CLI entry point.
 * Resolution: CLI's own directory, then CWD.
 * No hardcoded user-specific paths.
 */
export function defaultEnvDirs(): string[] {
  const cliDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const cwd = process.cwd();
  // Deduplicate in case CWD happens to equal cliDir
  return cliDir === cwd ? [cliDir] : [cliDir, cwd];
}
