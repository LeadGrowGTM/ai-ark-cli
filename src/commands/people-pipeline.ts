/**
 * People pipeline command — chains search → export → find-emails in one invocation.
 * Eliminates manual trackId juggling between the three async stages.
 * Stderr shows stage-labeled progress; final output is Tier 1 filtered and persisted.
 */

import { Command } from "commander";
import { createClient, AiArkApiError, pollUntilDone } from "../client/index.js";
import { formatOutput, pushToClay, persistResults, filterByProfile } from "../io/index.js";
import type { OutputFormat, Profile } from "../io/index.js";
import { buildAccountFilter, buildContactFilter } from "../filters.js";
import type { FilterOpts } from "../filters.js";
import { printReviewUrl, buildSearchUrl } from "../url-builder.js";
import type {
  PeopleSearchRequest,
  PeopleSearchResponse,
  ExportPeopleRequest,
  ExportJobResponse,
  ExportPeopleResultsResponse,
  EmailFinderRequest,
  EmailFinderStatistics,
  EmailFinderResultsResponse,
  ApiEndpoint,
} from "../types/api.js";

export function peoplePipelineCommand(): Command {
  return new Command("pipeline")
    .description("Chained search → export → find-emails (one-shot enrichment + email verification)")
    // Account (company) filters
    .option("--domain <domains...>", "Filter by company domain")
    .option("--company <names...>", "Filter by company name")
    .option("--industry <industries...>", "Filter by company industry")
    .option("--technology <techs...>", "Filter by technology stack")
    .option("--employees <range>", "Employee range (e.g. 50-200)")
    .option("--funding-type <types...>", "Filter by funding round (e.g. SERIES_A SERIES_B)")
    .option("--geo <lat,lng,radius>", "GeoLocation filter (e.g. 40.71,-74.00,50km)")
    .option("--geo-unit <unit>", "Geo radius unit: km or mi", "km")
    // Contact filters
    .option("--name <names...>", "Filter by person full name")
    .option("--title <titles...>", "Filter by current title")
    .option("--previous-title <titles...>", "Filter by previous title")
    .option("--seniority <levels...>", "Filter by seniority (founder, c_suite, vp, director, head, manager, senior)")
    .option("--department <depts...>", "Filter by department")
    .option("--location <locations...>", "Filter by person location")
    .option("--skills <skills...>", "Filter by skills")
    .option("--keyword <terms...>", "Search across headline, summary, organization")
    .option("--badge <badges...>", "Filter by profile badge (PAID_SOCIAL_MEMBERS, HIRING, OPEN_TO_WORK, CREATOR, INFLUENCER)")
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
    .option("--dry-run", "Print review URL + filter payload without submitting pipeline")
    .option("--no-review-url", "Suppress the 🔗 Review URL printed to stderr")
    .action(async (opts) => {
      try {
        const client = createClient();
        const format = opts.format as OutputFormat;
        const filterOpts = opts as FilterOpts;
        filterOpts.matchMode = opts.matchMode;
        // Map --exclude-name to excludeContactName (people cmd: --name is person, not company)
        filterOpts.excludeContactName = opts.excludeName;
        // keyword in people cmd goes to contact.keyword
        filterOpts.contactKeyword = opts.keyword;
        // Don't let keyword also set account.keyword
        filterOpts.keyword = undefined;

        // Validate profile early
        const profile = opts.profile as Profile;
        if (profile !== "outbound" && profile !== "raw") {
          console.error(`Error: --profile must be "outbound" or "raw" (got "${profile}")`);
          process.exit(1);
        }

        // Build filter payloads
        const account = buildAccountFilter(filterOpts, "people");
        const contact = buildContactFilter(filterOpts);
        const searchBody: PeopleSearchRequest = { page: 0, size: parseInt(opts.size, 10) };
        if (account) searchBody.account = account;
        if (contact) searchBody.contact = contact;

        // Emit review URL (unless suppressed)
        if (opts.reviewUrl !== false) {
          printReviewUrl(filterOpts, "people");
        }

        // Dry-run: print URL + payload, skip all API calls
        if (opts.dryRun) {
          process.stderr.write("Dry run — no pipeline submitted. Search payload:\n");
          formatOutput({ reviewUrl: buildSearchUrl(filterOpts, "people"), request: searchBody }, format);
          return;
        }

        // -----------------------------------------------------------------------
        // Stage 1 — Search
        // -----------------------------------------------------------------------
        process.stderr.write("[1/3] Searching...\n");
        const searchRes = await client.post<PeopleSearchResponse>("/people", searchBody);
        const trackId = searchRes.trackId;
        const searchCount = searchRes.content?.length ?? 0;
        process.stderr.write(`[1/3] Searching... found ${searchCount} profiles (trackId: ${trackId})\n`);
        if (!trackId) {
          console.error("Pipeline failed at stage [1/3]: no trackId returned from search");
          process.exit(1);
        }

        // -----------------------------------------------------------------------
        // Stage 2 — Export with email (export API includes email-finding)
        // -----------------------------------------------------------------------
        process.stderr.write("[2/3] Exporting...\n");
        // webhook required by API even though we poll via results endpoint
        const exportBody: ExportPeopleRequest = { page: 0, size: parseInt(opts.size, 10), webhook: "https://example.com/webhook" };
        if (account) exportBody.account = account;
        if (contact) exportBody.contact = contact;
        const exportJob = await client.post<ExportJobResponse>("/people/export", exportBody);
        const exportTrackId = exportJob.trackId;
        const exportStatsEndpoint: ApiEndpoint = `/people/export/${exportTrackId}/inquiries/statistics`;
        const exportPoll = await pollUntilDone(client, exportStatsEndpoint);
        if (exportPoll.state === "FAILED") {
          console.error(`Pipeline failed at stage [2/3]: export failed after ${exportPoll.elapsed}s`);
          process.exit(1);
        }
        process.stderr.write(`[2/3] Exporting... done — ${exportPoll.found} records\n`);

        // -----------------------------------------------------------------------
        // Stage 3 — Fetch all export results (emails included by the export job)
        // -----------------------------------------------------------------------
        process.stderr.write("[3/3] Fetching results...\n");
        const allResults: unknown[] = [];
        let page = 0;
        const pageSize = 100;
        while (true) {
          const results = await client.get<ExportPeopleResultsResponse>(
            `/people/export/${exportTrackId}/inquiries?page=${page}&size=${pageSize}` as ApiEndpoint,
          );
          allResults.push(...results.content);
          if (results.last || results.content.length === 0) break;
          page++;
        }
        process.stderr.write(`[3/3] Finding emails... done — ${allResults.length} verified\n`);

        // -----------------------------------------------------------------------
        // Final: filter → persist → push to Clay → format to stdout
        // -----------------------------------------------------------------------
        const filtered = filterByProfile(allResults, "person", profile);
        persistResults({
          data: filtered,
          command: "people-pipeline",
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
