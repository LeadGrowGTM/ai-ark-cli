/**
 * People search command — POST /people with account + contact filter flags.
 * Supports CSV/stdin input for batch processing and multi-format output.
 */

import { Command } from "commander";
import { createClient, AiArkApiError } from "../client/index.js";
import { formatOutput, readCsvFile, readStdin, pushToClay } from "../io/index.js";
import type { OutputFormat } from "../io/index.js";
import { buildAccountFilter, buildContactFilter } from "../filters.js";
import type { FilterOpts } from "../filters.js";
import { printReviewUrl, buildSearchUrl } from "../url-builder.js";
import type {
  PeopleSearchRequest,
  PeopleSearchResponse,
} from "../types/api.js";

export function peopleSearchCommand(): Command {
  return new Command("search")
    .description("Search 400M+ people profiles")
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
    .option("--linkedin <urls...>", "Filter by LinkedIn URL")
    .option("--keyword <terms...>", "Search across headline, summary, organization")
    .option("--badge <badges...>", "Filter by profile badge (PAID_SOCIAL_MEMBERS, HIRING, OPEN_TO_WORK, CREATOR, INFLUENCER)")
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
    .option("--page <number>", "Page number (0-based)", "0")
    .option("--size <number>", "Results per page (1-100)", "10")
    .option("--format <type>", "Output format: json, csv, table", "json")
    .option("--input <file>", "CSV file for batch input")
    .option("--domain-col <name>", "Column name for domain in CSV", "domain")
    .option("--clay-table <id>", "Push results to a Clay table")
    .option("--dry-run", "Print review URL + filter payload without calling the API")
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
        const savedKeyword = filterOpts.keyword;
        filterOpts.keyword = undefined;

        // Determine input source
        let domains: string[] = opts.domain || [];

        if (opts.input) {
          const records = readCsvFile(opts.input);
          const col = opts.domainCol;
          const csvDomains = records.map((r: Record<string, string>) => r[col]).filter(Boolean);
          if (csvDomains.length === 0) {
            console.error(`Error: No values found in column "${col}" of ${opts.input}`);
            process.exit(1);
          }
          domains = [...domains, ...csvDomains];
        } else if (!process.stdin.isTTY) {
          const records = await readStdin();
          const stdinDomains = records.map((r) => r.domain || r.value).filter(Boolean);
          domains = [...domains, ...stdinDomains];
        }

        // Resolve domains onto filterOpts so the URL reflects the real search.
        if (domains.length > 0) {
          filterOpts.domain = domains;
        }

        // Emit review URL (unless suppressed).
        if (opts.reviewUrl !== false) {
          printReviewUrl(filterOpts, "people");
        }

        // Dry-run: print URL + payload, skip the API call entirely.
        if (opts.dryRun) {
          const body: PeopleSearchRequest = {
            page: parseInt(opts.page, 10),
            size: parseInt(opts.size, 10),
          };
          const account = buildAccountFilter(filterOpts, "people");
          if (account) body.account = account;
          const contact = buildContactFilter(filterOpts);
          if (contact) body.contact = contact;
          process.stderr.write("Dry run — no API call made. Payload:\n");
          formatOutput({ reviewUrl: buildSearchUrl(filterOpts, "people"), request: body }, format);
          filterOpts.keyword = savedKeyword;
          return;
        }

        // If we have batch domains, search each one
        if (domains.length > 1) {
          const allResults: unknown[] = [];
          for (const domain of domains) {
            const batchOpts = { ...filterOpts, domain: [domain] };
            const body: PeopleSearchRequest = {
              page: parseInt(opts.page, 10),
              size: parseInt(opts.size, 10),
            };
            const account = buildAccountFilter(batchOpts, "people");
            if (account) body.account = account;
            const contact = buildContactFilter(batchOpts);
            if (contact) body.contact = contact;
            const result = await client.post<PeopleSearchResponse>("/people", body);
            allResults.push(...result.content);
          }
          if (opts.clayTable) {
            pushToClay(opts.clayTable, allResults);
          }
          formatOutput(allResults, format);
          // Restore keyword
          filterOpts.keyword = savedKeyword;
          return;
        }

        // Single query
        const body: PeopleSearchRequest = {
          page: parseInt(opts.page, 10),
          size: parseInt(opts.size, 10),
        };

        const account = buildAccountFilter(filterOpts, "people");
        if (account) body.account = account;

        const contact = buildContactFilter(filterOpts);
        if (contact) body.contact = contact;

        const result = await client.post<PeopleSearchResponse>("/people", body);

        if (opts.clayTable) {
          pushToClay(opts.clayTable, result.content);
        }
        formatOutput(format === "json" ? result : result.content, format);

        // Restore keyword
        filterOpts.keyword = savedKeyword;
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
