/**
 * People export command — POST /people/export (async).
 * Submits export job, auto-polls until done, fetches and outputs results.
 * --no-wait returns the trackId immediately without polling.
 */

import { Command } from "commander";
import { createClient, AiArkApiError, pollUntilDone } from "../client/index.js";
import type {
  ExportPeopleRequest,
  ExportJobResponse,
  ExportPeopleResultsResponse,
  ApiEndpoint,
} from "../types/api.js";

export function peopleExportCommand(): Command {
  return new Command("export")
    .description("Bulk export with email discovery")
    .option("--domain <domains...>", "Filter by company domain")
    .option("--company <names...>", "Filter by company name")
    .option("--industry <industries...>", "Filter by company industry")
    .option("--location <locations...>", "Filter by person location")
    .option("--seniority <levels...>", "Filter by seniority")
    .option("--department <depts...>", "Filter by department")
    .option("--title <titles...>", "Filter by current title")
    .option("--size <number>", "Max people to export (1-10000)", "100")
    .option("--no-wait", "Return trackId immediately without polling")
    .action(async (opts) => {
      try {
        const client = createClient();

        const body: ExportPeopleRequest = {
          page: 0,
          size: parseInt(opts.size, 10),
        };

        // Build account filter
        const hasAccount = opts.domain || opts.company || opts.industry;
        if (hasAccount) {
          body.account = {};
          if (opts.domain) {
            body.account.domain = { all: opts.domain };
          }
          if (opts.company) {
            body.account.name = { all: opts.company };
          }
          if (opts.industry) {
            body.account.industries = { any: opts.industry };
          }
        }

        // Build contact filter
        const hasContact = opts.location || opts.seniority || opts.department || opts.title;
        if (hasContact) {
          body.contact = {};
          if (opts.location) {
            body.contact.location = { any: opts.location };
          }
          if (opts.seniority) {
            body.contact.seniority = { any: opts.seniority };
          }
          if (opts.department) {
            body.contact.department = { any: opts.department };
          }
          if (opts.title) {
            body.contact.experience = { currentTitle: { any: opts.title } };
          }
        }

        // Submit the export job
        const job = await client.post<ExportJobResponse>("/people/export", body);

        if (!opts.wait) {
          // --no-wait: just return the trackId
          console.log(JSON.stringify({ trackId: job.trackId, state: job.state }, null, 2));
          return;
        }

        // Poll until done
        process.stderr.write(`Export started (trackId: ${job.trackId})\n`);
        const statsEndpoint: ApiEndpoint = `/people/export/${job.trackId}/inquiries/statistics`;
        const poll = await pollUntilDone(client, statsEndpoint);

        if (poll.state === "FAILED") {
          console.error(`Export failed after ${poll.elapsed}s`);
          process.exit(1);
        }

        // Fetch results (paginate through all)
        process.stderr.write(`Fetching ${poll.found} results...\n`);
        const allResults: unknown[] = [];
        let page = 0;
        const pageSize = 100;

        while (true) {
          const resultsEndpoint: ApiEndpoint = `/people/export/${job.trackId}/inquiries`;
          const results = await client.get<ExportPeopleResultsResponse>(
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
