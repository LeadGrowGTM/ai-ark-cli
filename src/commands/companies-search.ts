/**
 * Companies search command — POST /companies with account filter flags.
 * Supports CSV/stdin input for batch processing and multi-format output.
 */

import { Command } from "commander";
import { createClient, AiArkApiError } from "../client/index.js";
import { formatOutput, readCsvFile, readStdin, pushToClay } from "../io/index.js";
import type { OutputFormat } from "../io/index.js";
import type {
  CompanySearchRequest,
  CompanySearchResponse,
} from "../types/api.js";

export function companiesSearchCommand(): Command {
  return new Command("search")
    .description("Search 69M+ company profiles")
    .option("--domain <domains...>", "Filter by domain (e.g. leadgrow.ai)")
    .option("--name <names...>", "Filter by company name")
    .option("--industry <industries...>", "Filter by industry")
    .option("--location <locations...>", "Filter by location")
    .option("--technology <techs...>", "Filter by technology stack")
    .option("--lookalike <domains...>", "Find similar companies (up to 5 domains)")
    .option("--employees <range>", "Employee range (e.g. 50-200)")
    .option("--page <number>", "Page number (0-based)", "0")
    .option("--size <number>", "Results per page (1-100)", "10")
    .option("--format <type>", "Output format: json, csv, table", "json")
    .option("--input <file>", "CSV file for batch input")
    .option("--domain-col <name>", "Column name for domain in CSV", "domain")
    .option("--clay-table <id>", "Push results to a Clay table")
    .action(async (opts) => {
      try {
        const client = createClient();
        const format = opts.format as OutputFormat;

        // Determine input source
        let domains: string[] = opts.domain || [];

        if (opts.input) {
          const records = readCsvFile(opts.input);
          const col = opts.domainCol;
          const csvDomains = records.map((r) => r[col]).filter(Boolean);
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

        // If we have batch domains, search each one
        if (domains.length > 1) {
          const allResults: unknown[] = [];
          for (const domain of domains) {
            const body: CompanySearchRequest = {
              page: parseInt(opts.page, 10),
              size: parseInt(opts.size, 10),
              account: { domain: { all: { include: [domain] } } },
            };
            applyFilters(body, opts);
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

        if (domains.length === 1) {
          body.account = { ...body.account, domain: { all: { include: domains } } };
        }
        if (opts.lookalike) {
          body.lookalikeDomains = opts.lookalike;
        }
        applyFilters(body, opts);

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

function applyFilters(body: CompanySearchRequest, opts: Record<string, unknown>): void {
  const name = opts.name as string[] | undefined;
  const industry = opts.industry as string[] | undefined;
  const location = opts.location as string[] | undefined;
  const technology = opts.technology as string[] | undefined;
  const employees = opts.employees as string | undefined;

  if (name || industry || location || technology || employees) {
    body.account = body.account || {};
    if (name) body.account.name = { any: { include: name } };
    if (industry) body.account.industries = { any: { include: industry } };
    if (location) body.account.location = { any: { include: location } };
    if (technology) body.account.technologies = { any: { include: technology } };
    if (employees) {
      const [min, max] = employees.split("-").map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        body.account.employeeSize = { all: [[min, max]] };
      }
    }
  }
}
