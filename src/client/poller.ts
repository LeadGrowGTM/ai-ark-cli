/**
 * Async job poller with progress display.
 * Shared between export people and email finder commands.
 */

import type { AiArkClient } from "./http.js";
import type { ApiEndpoint, ExportStatistics } from "../types/api.js";

const POLL_INTERVAL_MS = 3000;
const TERMINAL_STATES = new Set(["DONE", "FAILED", "COMPLETED"]);

export interface PollResult {
  state: string;
  total: number;
  found: number;
  notFound: number;
  elapsed: number;
}

/**
 * Polls a statistics endpoint until the job reaches a terminal state.
 * Writes progress updates to stderr so stdout stays clean for JSON output.
 */
export async function pollUntilDone(
  client: AiArkClient,
  statsEndpoint: ApiEndpoint,
): Promise<PollResult> {
  const start = Date.now();
  let lastLine = "";

  while (true) {
    const stats = await client.get<ExportStatistics>(statsEndpoint);
    const elapsed = Math.round((Date.now() - start) / 1000);

    // Clear previous line and write progress
    const line = `  ${stats.state} | total: ${stats.total} | found: ${stats.found} | not found: ${stats.notFound} | ${elapsed}s`;
    if (line !== lastLine) {
      process.stderr.write(`\r\x1b[K${line}`);
      lastLine = line;
    }

    if (TERMINAL_STATES.has(stats.state)) {
      process.stderr.write("\n");
      return {
        state: stats.state,
        total: stats.total,
        found: stats.found,
        notFound: stats.notFound,
        elapsed,
      };
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
