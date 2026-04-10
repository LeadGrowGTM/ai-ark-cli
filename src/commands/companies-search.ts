/**
 * Companies search command — POST /companies with account filter flags.
 * Supports CSV/stdin input for batch processing and multi-format output.
 */

import { Command } from "commander";
import { createClient, AiArkApiError } from "../client/index.js";
import { formatOutput, readCsvFile, readStdin, pushToClay } from "../io/index.js";
import type { OutputFormat } from "../io/index.js";
import { buildAccountFilter } from "../filters.js";
import type { FilterOpts } from "../filters.js";
import { printReviewUrl, buildSearchUrl } from "../url-builder.js";
import type {
  CompanySearchRequest,
  CompanySearchResponse,
} from "../types/api.js";

export function companiesSearchCommand(): Command {
  return new Command("search")
    .description("Search 69M+ company profiles")
    // Include filters
    .option("--domain <domains...>", "Filter by domain (e.g. leadgrow.ai)")
    .option("--name <names...>", "Filter by company name")
    .option("--industry <industries...>", "Filter by industry")
    .option("--location <locations...>", "Filter by location")
    .option("--technology <techs...>", "Filter by technology stack")
    .option("--keyword <terms...>", "Search across name, description, industry")
    .option("--employees <range>", "Employee range (e.g. 50-200)")
    .option("--funding-type <types...>", "Filter by funding round (e.g. SERIES_A SERIES_B)")
    .option("--geo <lat,lng,radius>", "GeoLocation filter (e.g. 40.71,-74.00,50km)")
    .option("--geo-unit <unit>", "Geo radius unit: km or mi", "km")
    .option("--products <terms...>", "Filter by products/services")
    .option("--revenue <range>", "Revenue range (e.g. 1000000-50000000)")
    .option("--retail-size <range>", "Number of retail locations (e.g. 5-100)")
    .option("--lookalike <domains...>", "Find similar companies (up to 5 domains)")
    // Exclude filters
    .option("--exclude-domain <domains...>", "Exclude domains")
    .option("--exclude-domain-file <file>", "Exclude domains from CSV file")
    .option("--exclude-domain-col <name>", "Column name in exclude CSV", "domain")
    .option("--exclude-name <names...>", "Exclude company names")
    .option("--exclude-industry <industries...>", "Exclude industries")
    .option("--exclude-location <locations...>", "Exclude locations")
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

        if (opts.reviewUrl !== false) {
          printReviewUrl(filterOpts, "companies");
        }

        if (opts.dryRun) {
          const body: CompanySearchRequest = {
            page: parseInt(opts.page, 10),
            size: parseInt(opts.size, 10),
          };
          body.account = buildAccountFilter(filterOpts, "company");
          process.stderr.write("Dry run — no API call made. Payload:\n");
          formatOutput(
            { reviewUrl: buildSearchUrl(filterOpts, "companies"), request: body },
            format,
          );
          return;
        }

        // If we have batch domains, search each one
        if (domains.length > 1) {
          const allResults: unknown[] = [];
          for (const domain of domains) {
            const batchOpts = { ...filterOpts, domain: [domain] };
            const body: CompanySearchRequest = {
              page: parseInt(opts.page, 10),
              size: parseInt(opts.size, 10),
            };
            body.account = buildAccountFilter(batchOpts, "company");
            const result = await client.post<CompanySearchResponse>("/companies", body);
            allResults.push(...result.content);
          }
          if (opts.clayTable) {
            pushToClay(opts.clayTable, allResults);
          }
          formatOutput(allResults, format);
          return;
        }

        // Single query
        const body: CompanySearchRequest = {
          page: parseInt(opts.page, 10),
          size: parseInt(opts.size, 10),
        };

        const account = buildAccountFilter(filterOpts, "company");
        if (account) body.account = account;

        if (opts.lookalike) {
          body.lookalikeDomains = opts.lookalike;
        }

        const result = await client.post<CompanySearchResponse>("/companies", body);

        if (opts.clayTable) {
          pushToClay(opts.clayTable, result.content);
        }
        formatOutput(format === "json" ? result : result.content, format);
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
