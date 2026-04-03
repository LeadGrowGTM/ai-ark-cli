/**
 * People export command — POST /people/export (async).
 * Submits export job, auto-polls until done, fetches and outputs results.
 * --no-wait returns the trackId immediately without polling.
 */

import { Command } from "commander";
import { createClient, AiArkApiError, pollUntilDone } from "../client/index.js";
import { formatOutput, pushToClay } from "../io/index.js";
import type { OutputFormat } from "../io/index.js";
import { buildAccountFilter, buildContactFilter } from "../filters.js";
import type { FilterOpts } from "../filters.js";
import type {
  ExportPeopleRequest,
  ExportJobResponse,
  ExportPeopleResultsResponse,
  ApiEndpoint,
} from "../types/api.js";

export function peopleExportCommand(): Command {
  return new Command("export")
    .description("Bulk export with email discovery")
    // Account (company) filters
    .option("--domain <domains...>", "Filter by company domain")
    .option("--company <names...>", "Filter by company name")
    .option("--industry <industries...>", "Filter by company industry")
    .option("--technology <techs...>", "Filter by company technology")
    .option("--employees <range>", "Employee range (e.g. 50-200)")
    .option("--funding-type <types...>", "Filter by funding round (e.g. SERIES_A SERIES_B)")
    .option("--geo <lat,lng,radius>", "GeoLocation filter (e.g. 40.71,-74.00,50km)")
    .option("--geo-unit <unit>", "Geo radius unit: km or mi", "km")
    // Contact filters
    .option("--name <names...>", "Filter by person full name")
    .option("--title <titles...>", "Filter by current title")
    .option("--previous-title <titles...>", "Filter by previous title")
    .option("--seniority <levels...>", "Filter by seniority")
    .option("--department <depts...>", "Filter by department")
    .option("--location <locations...>", "Filter by person location")
    .option("--skills <skills...>", "Filter by skills")
    .option("--keyword <terms...>", "Search across headline, summary, organization")
    .option("--badge <badges...>", "Filter by profile badge (PAID_SOCIAL_MEMBERS, HIRING, OPEN_TO_WORK)")
    .option("--job-duration-min <months>", "Minimum months in current role")
    .option("--job-duration-max <months>", "Maximum months in current role")
    // Exclude filters
    .option("--exclude-domain <domains...>", "Exclude company domains")
    .option("--exclude-domain-file <file>", "Exclude domains from CSV file")
    .option("--exclude-domain-col <name>", "Column name in exclude CSV", "domain")
    .option("--exclude-company <names...>", "Exclude company names")
    .option("--exclude-industry <industries...>", "Exclude industries")
    .option("--exclude-title <titles...>", "Exclude job titles")
    .option("--exclude-seniority <levels...>", "Exclude seniority levels")
    .option("--exclude-department <depts...>", "Exclude departments")
    .option("--exclude-location <locs...>", "Exclude locations")
    .option("--exclude-badge <badges...>", "Exclude profile badges")
    .option("--exclude-name <names...>", "Exclude person names")
    // Global
    .option("--match-mode <mode>", "Search mode: SMART, WORD, STRICT", "SMART")
    .option("--size <number>", "Max people to export (1-10000)", "100")
    .option("--format <type>", "Output format: json, csv, table", "json")
    .option("--clay-table <id>", "Push results to a Clay table")
    .option("--no-wait", "Return trackId immediately without polling")
    .action(async (opts) => {
      try {
        const client = createClient();
        const format = opts.format as OutputFormat;
        const filterOpts = opts as FilterOpts;
        filterOpts.matchMode = opts.matchMode;
        filterOpts.excludeContactName = opts.excludeName;
        filterOpts.contactKeyword = opts.keyword;
        filterOpts.keyword = undefined;

        const body: ExportPeopleRequest = {
          page: 0,
          size: parseInt(opts.size, 10),
        };

        const account = buildAccountFilter(filterOpts, "people");
        if (account) body.account = account;

        const contact = buildContactFilter(filterOpts);
        if (contact) body.contact = contact;

        // Submit the export job
        const job = await client.post<ExportJobResponse>("/people/export", body);

        if (!opts.wait) {
          formatOutput({ trackId: job.trackId, state: job.state }, format);
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

        if (opts.clayTable) {
          pushToClay(opts.clayTable, allResults);
        }
        formatOutput(allResults, format);
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
