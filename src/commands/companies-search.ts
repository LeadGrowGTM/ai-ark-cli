/**
 * Companies search command — POST /companies with account filter flags.
 */

import { Command } from "commander";
import { createClient, AiArkApiError } from "../client/index.js";
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
    .action(async (opts) => {
      try {
        const client = createClient();

        const body: CompanySearchRequest = {
          page: parseInt(opts.page, 10),
          size: parseInt(opts.size, 10),
        };

        if (opts.lookalike) {
          body.lookalikeDomains = opts.lookalike;
        }

        // Build account filter from flags
        const hasAccountFilter =
          opts.domain || opts.name || opts.industry || opts.location || opts.technology || opts.employees;

        if (hasAccountFilter) {
          body.account = {};

          if (opts.domain) {
            body.account.domain = { all: opts.domain };
          }
          if (opts.name) {
            body.account.name = { all: opts.name };
          }
          if (opts.industry) {
            body.account.industries = { any: opts.industry };
          }
          if (opts.location) {
            body.account.location = { any: opts.location };
          }
          if (opts.technology) {
            body.account.technologies = { any: opts.technology };
          }
          if (opts.employees) {
            const [min, max] = opts.employees.split("-").map(Number);
            if (!isNaN(min) && !isNaN(max)) {
              body.account.employeeSize = { all: [[min, max]] };
            }
          }
        }

        const result = await client.post<CompanySearchResponse>("/companies", body);
        console.log(JSON.stringify(result, null, 2));
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
