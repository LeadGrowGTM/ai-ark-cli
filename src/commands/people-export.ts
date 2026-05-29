/**
 * People export command — POST /people/export (async).
 * Submits export job, auto-polls until done, fetches and outputs results.
 * --no-wait returns the trackId immediately without polling.
 */

import { Command } from "commander";
import { createClient, AiArkApiError, pollUntilDone } from "../client/index.js";
import { formatOutput, pushToClay, persistResults, filterByProfile } from "../io/index.js";
import type { OutputFormat, Profile } from "../io/index.js";
import { buildAccountFilter, buildContactFilter } from "../filters.js";
import type { FilterOpts } from "../filters.js";
import { printReviewUrl, buildSearchUrl } from "../url-builder.js";
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
    // Social reach (LinkedIn only)
    .option("--min-followers <count>", "Min LinkedIn followers (e.g. 5000 or 5k)")
    .option("--max-followers <count>", "Max LinkedIn followers")
    .option("--followers <bands>", "Follower bands, comma-separated (e.g. 1k-2k,5k+,<500)")
    .option("--min-connections <count>", "Min LinkedIn connections (e.g. 500)")
    .option("--max-connections <count>", "Max LinkedIn connections")
    .option("--connections <bands>", "Connection bands, comma-separated (e.g. 500-1k,3k+)")
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
    .option("--profile <name>", "Output shape: outbound (Tier 1 fields, default) or raw (full API response)", "outbound")
    .option("--clay-table <id>", "Push results to a Clay table")
    .option("--output <file>", "Write results to this exact path instead of ~/.ai-ark/results/")
    .option("--no-save", "Skip auto-save to ~/.ai-ark/results/")
    .option("--dry-run", "Print review URL + filter payload without submitting export")
    .option("--no-review-url", "Suppress the 🔗 Review URL printed to stderr")
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

        // Validate profile early
        const profile = opts.profile as Profile;
        if (profile !== "outbound" && profile !== "raw") {
          console.error(`Error: --profile must be "outbound" or "raw" (got "${profile}")`);
          process.exit(1);
        }

        // webhook is required by the API even though we poll via statistics endpoint
        const body: ExportPeopleRequest = {
          page: 0,
          size: parseInt(opts.size, 10),
          webhook: "https://example.com/webhook",
        };

        const account = buildAccountFilter(filterOpts, "people");
        if (account) body.account = account;

        const contact = buildContactFilter(filterOpts);
        if (contact) body.contact = contact;

        if (opts.reviewUrl !== false) {
          printReviewUrl(filterOpts, "people");
        }

        if (opts.dryRun) {
          process.stderr.write("Dry run — no export submitted. Payload:\n");
          formatOutput(
            { reviewUrl: buildSearchUrl(filterOpts, "people"), request: body },
            format,
          );
          return;
        }

        // Submit the export job
        const job = await client.post<ExportJobResponse>("/people/export", body);

        if (!opts.wait) {
          const noWaitData = { trackId: job.trackId, state: job.state };
          persistResults({
            data: noWaitData,
            command: "people-export",
            output: opts.output,
            noSave: opts.save === false,
          });
          formatOutput(noWaitData, format);
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

        const filtered = filterByProfile(allResults, "person", profile);
        persistResults({
          data: filtered,
          command: "people-export",
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
