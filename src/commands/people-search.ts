/**
 * People search command — POST /people with account + contact filter flags.
 */

import { Command } from "commander";
import { createClient, AiArkApiError } from "../client/index.js";
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
    .action(async (opts) => {
      try {
        const client = createClient();

        const body: PeopleSearchRequest = {
          page: parseInt(opts.page, 10),
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
        const hasContact =
          opts.location || opts.seniority || opts.department || opts.title || opts.name || opts.skills || opts.linkedin;
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
          if (opts.name) {
            body.contact.fullName = { any: opts.name };
          }
          if (opts.skills) {
            body.contact.skills = { any: opts.skills };
          }
          if (opts.linkedin) {
            body.contact.linkedin = { all: opts.linkedin };
          }
        }

        const result = await client.post<PeopleSearchResponse>("/people", body);
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
