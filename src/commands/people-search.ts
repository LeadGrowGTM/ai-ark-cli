/**
 * People search command — POST /people with account + contact filter flags.
 * Supports CSV/stdin input for batch processing and multi-format output.
 */

import { Command } from "commander";
import { createClient, AiArkApiError } from "../client/index.js";
import { formatOutput, readCsvFile, readStdin, pushToClay } from "../io/index.js";
import type { OutputFormat } from "../io/index.js";
import type {
  PeopleSearchRequest,
  PeopleSearchResponse,
} from "../types/api.js";

export function peopleSearchCommand(): Command {
  return new Command("search")
    .description("Search 400M+ people profiles")
    .option("--domain <domains...>", "Filter by company domain")
    .option("--company <names...>", "Filter by company name")
    .option("--industry <industries...>", "Filter by company industry")
    .option("--location <locations...>", "Filter by person location")
    .option("--seniority <levels...>", "Filter by seniority (e.g. founder, c_suite, director)")
    .option("--department <depts...>", "Filter by department")
    .option("--title <titles...>", "Filter by current title")
    .option("--name <names...>", "Filter by person full name")
    .option("--skills <skills...>", "Filter by skills")
    .option("--linkedin <urls...>", "Filter by LinkedIn URL")
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
            const body: PeopleSearchRequest = {
              page: parseInt(opts.page, 10),
              size: parseInt(opts.size, 10),
              account: { domain: { all: [domain] } },
            };
            applyContactFilters(body, opts);
            const result = await client.post<PeopleSearchResponse>("/people", body);
            allResults.push(...result.content);
          }
          if (opts.clayTable) {
            pushToClay(opts.clayTable, allResults);
          }
          formatOutput(allResults, format);
          return;
        }

        // Single query
        const body: PeopleSearchRequest = {
          page: parseInt(opts.page, 10),
          size: parseInt(opts.size, 10),
        };

        // Build account filter
        const hasAccount = (domains.length > 0) || opts.company || opts.industry;
        if (hasAccount) {
          body.account = {};
          if (domains.length > 0) {
            body.account.domain = { all: domains };
          }
          if (opts.company) {
            body.account.name = { all: opts.company };
          }
          if (opts.industry) {
            body.account.industries = { any: opts.industry };
          }
        }

        applyContactFilters(body, opts);

        const result = await client.post<PeopleSearchResponse>("/people", body);

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

function applyContactFilters(body: PeopleSearchRequest, opts: Record<string, unknown>): void {
  const location = opts.location as string[] | undefined;
  const seniority = opts.seniority as string[] | undefined;
  const department = opts.department as string[] | undefined;
  const title = opts.title as string[] | undefined;
  const name = opts.name as string[] | undefined;
  const skills = opts.skills as string[] | undefined;
  const linkedin = opts.linkedin as string[] | undefined;

  const hasContact = location || seniority || department || title || name || skills || linkedin;
  if (hasContact) {
    body.contact = {};
    if (location) body.contact.location = { any: location };
    if (seniority) body.contact.seniority = { any: seniority };
    if (department) body.contact.department = { any: department };
    if (title) body.contact.experience = { currentTitle: { any: title } };
    if (name) body.contact.fullName = { any: name };
    if (skills) body.contact.skills = { any: skills };
    if (linkedin) body.contact.linkedin = { all: linkedin };
  }
}
