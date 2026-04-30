/**
 * Async job poller with progress display.
 * Shared between export people and email finder commands.
 *
 * AI Ark statistics endpoints (/inquiries/statistics, /statistics) require
 * OAuth Bearer tokens that the CLI doesn't have. We poll the results endpoints
 * instead: 409 = still processing, 200 = done.
 */

import { AiArkApiError, type AiArkClient } from "./http.js";
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
 * Falls back to results-endpoint polling (409 = in-progress, 200 = done)
 * when the statistics endpoint returns 401 (requires OAuth, not X-TOKEN).
 */
export async function pollUntilDone(
  client: AiArkClient,
  statsEndpoint: ApiEndpoint,
): Promise<PollResult> {
  const start = Date.now();
  let lastLine = "";

  // First attempt: try the statistics endpoint
  try {
    const stats = await client.get<ExportStatistics>(statsEndpoint);
    // Statistics endpoint works — use it for polling
    const elapsed = Math.round((Date.now() - start) / 1000);
    const line = `  ${stats.state} | total: ${stats.total} | found: ${stats.found} | not found: ${stats.notFound} | ${elapsed}s`;
    process.stderr.write(`\r\x1b[K${line}`);
    lastLine = line;

    if (TERMINAL_STATES.has(stats.state)) {
      process.stderr.write("\n");
      return { state: stats.state, total: stats.total, found: stats.found, notFound: stats.notFound, elapsed };
    }

    await sleep(POLL_INTERVAL_MS);

    while (true) {
      const s = await client.get<ExportStatistics>(statsEndpoint);
      const el = Math.round((Date.now() - start) / 1000);
      const ln = `  ${s.state} | total: ${s.total} | found: ${s.found} | not found: ${s.notFound} | ${el}s`;
      if (ln !== lastLine) { process.stderr.write(`\r\x1b[K${ln}`); lastLine = ln; }
      if (TERMINAL_STATES.has(s.state)) {
        process.stderr.write("\n");
        return { state: s.state, total: s.total, found: s.found, notFound: s.notFound, elapsed: el };
      }
      await sleep(POLL_INTERVAL_MS);
    }
  } catch (e) {
    if (!(e instanceof AiArkApiError) && !(e instanceof Error && (e.message.includes("HTTP 401") || e.message.includes("HTTP 403")))) {
      throw e; // Not an auth error — rethrow
    }
    // Statistics endpoint requires OAuth — fall back to results-endpoint polling
    process.stderr.write("  (polling via results endpoint)\n");
  }

  // Fallback: poll the results endpoint. 409 = in progress, 200 = done.
  const resultsEndpoint = deriveResultsEndpoint(statsEndpoint);

  while (true) {
    const elapsed = Math.round((Date.now() - start) / 1000);
    try {
      const r = await client.get<{ content: unknown[]; last: boolean; totalElements: number }>(resultsEndpoint);
      const line = `  DONE | found: ${r.totalElements} | ${elapsed}s`;
      if (line !== lastLine) { process.stderr.write(`\r\x1b[K${line}`); lastLine = line; }
      process.stderr.write("\n");
      return { state: "DONE", total: r.totalElements, found: r.totalElements, notFound: 0, elapsed };
    } catch (e) {
      if (e instanceof AiArkApiError && e.status === 409) {
        const line = `  IN_PROGRESS | ${elapsed}s`;
        if (line !== lastLine) { process.stderr.write(`\r\x1b[K${line}`); lastLine = line; }
        await sleep(POLL_INTERVAL_MS);
        continue;
      }
      if (e instanceof AiArkApiError && e.status === 404) {
        process.stderr.write("\n");
        return { state: "FAILED", total: 0, found: 0, notFound: 0, elapsed };
      }
      throw e;
    }
  }
}

/**
 * Derives the results endpoint from a statistics endpoint path.
 * /people/export/{id}/inquiries/statistics → /people/export/{id}/inquiries?page=0&size=1
 * /people/email-finder/{id}/statistics    → /people/email-finder/{id}/inquiries?page=0&size=1
 */
function deriveResultsEndpoint(statsEndpoint: ApiEndpoint): ApiEndpoint {
  const s = statsEndpoint as string;
  if (s.includes("/inquiries/statistics")) {
    return s.replace("/inquiries/statistics", "/inquiries?page=0&size=1") as ApiEndpoint;
  }
  if (s.endsWith("/statistics")) {
    return (s.replace(/\/statistics$/, "/inquiries?page=0&size=1")) as ApiEndpoint;
  }
  return `${s}/inquiries?page=0&size=1` as ApiEndpoint;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
