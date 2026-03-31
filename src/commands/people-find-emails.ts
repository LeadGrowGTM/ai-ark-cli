/**
 * People find-emails command — POST /people/email-finder (async).
 * Takes a trackId from people search, triggers email finding, polls, fetches results.
 * --no-wait returns immediately without polling.
 */

import { Command } from "commander";
import { createClient, AiArkApiError, pollUntilDone } from "../client/index.js";
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
    .option("--no-wait", "Return immediately without polling")
    .action(async (opts) => {
      try {
        const client = createClient();

        const body: EmailFinderRequest = {
          trackId: opts.trackId,
        };

        // Submit the email finder job
        const job = await client.post<EmailFinderStatistics>("/people/email-finder", body);

        if (!opts.wait) {
          // --no-wait: just return the initial response
          console.log(JSON.stringify({ trackId: opts.trackId, state: job.state }, null, 2));
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

        console.log(JSON.stringify(allResults, null, 2));
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
