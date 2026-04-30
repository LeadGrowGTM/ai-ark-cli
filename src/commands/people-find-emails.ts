/**
 * People find-emails command — POST /people/email-finder (async).
 * Takes a trackId from people search, triggers email finding, polls, fetches results.
 * --no-wait returns immediately without polling.
 */

import { Command } from "commander";
import { createClient, AiArkApiError, pollUntilDone } from "../client/index.js";
import { formatOutput, pushToClay, persistResults, filterByProfile } from "../io/index.js";
import type { OutputFormat, Profile } from "../io/index.js";
import type {
  EmailFinderRequest,
  EmailFinderStatistics,
  EmailFinderResultsResponse,
  ApiEndpoint,
} from "../types/api.js";

export function peopleFindEmailsCommand(): Command {
  return new Command("find-emails")
    .description("Find emails from search track ID")
    .requiredOption("--track-id <id>", "Track ID from a people search response")
    .option("--format <type>", "Output format: json, csv, table", "json")
    .option("--profile <name>", "Output shape: outbound (Tier 1 fields, default) or raw (full API response)", "outbound")
    .option("--clay-table <id>", "Push results to a Clay table")
    .option("--output <file>", "Write results to this exact path instead of ~/.ai-ark/results/")
    .option("--no-save", "Skip auto-save to ~/.ai-ark/results/")
    .option("--no-wait", "Return immediately without polling")
    .action(async (opts) => {
      try {
        const client = createClient();
        const format = opts.format as OutputFormat;

        // Validate profile early
        const profile = opts.profile as Profile;
        if (profile !== "outbound" && profile !== "raw") {
          console.error(`Error: --profile must be "outbound" or "raw" (got "${profile}")`);
          process.exit(1);
        }

        // webhook required by API even though we poll via results endpoint
        const body: EmailFinderRequest = {
          trackId: opts.trackId,
          webhook: "https://example.com/webhook",
        };

        // Submit the email finder job
        const job = await client.post<EmailFinderStatistics>("/people/email-finder", body);

        if (!opts.wait) {
          const noWaitData = { trackId: opts.trackId, state: job.state };
          persistResults({
            data: noWaitData,
            command: "people-find-emails",
            output: opts.output,
            noSave: opts.save === false,
          });
          formatOutput(noWaitData, format);
          return;
        }

        // Poll until done
        process.stderr.write(`Email finder started (trackId: ${opts.trackId})\n`);
        const statsEndpoint: ApiEndpoint = `/people/email-finder/${opts.trackId}/statistics`;
        const poll = await pollUntilDone(client, statsEndpoint);

        if (poll.state === "FAILED") {
          console.error(`Email finder failed after ${poll.elapsed}s`);
          process.exit(1);
        }

        // Fetch results (paginate through all)
        process.stderr.write(`Fetching ${poll.found} results...\n`);
        const allResults: unknown[] = [];
        let page = 0;
        const pageSize = 100;

        while (true) {
          const resultsEndpoint: ApiEndpoint = `/people/email-finder/${opts.trackId}/inquiries`;
          const results = await client.get<EmailFinderResultsResponse>(
            `${resultsEndpoint}?page=${page}&size=${pageSize}` as ApiEndpoint,
          );
          allResults.push(...results.content);
          if (results.last || results.content.length === 0) break;
          page++;
        }

        const filtered = filterByProfile(allResults, "person", profile);
        persistResults({
          data: filtered,
          command: "people-find-emails",
          output: opts.output,
          noSave: opts.save === false,
        });
        if (opts.clayTable) {
          pushToClay(opts.clayTable, filtered as unknown[]);
        }
        formatOutput(filtered, format);
      } catch (error) {
        if (error instanceof AiArkApiError) {
          console.error(`Error: ${error.message}`);
          process.exit(1);
        }
        if (error instanceof Error) {
          console.error(`Error: ${error.message}`);
          process.exit(1);
        }
        console.error("Error: Unknown error occurred");
        process.exit(1);
      }
    });
}
