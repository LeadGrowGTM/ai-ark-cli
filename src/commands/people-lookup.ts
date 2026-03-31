/**
 * People reverse lookup command — POST /people/reverse-lookup.
 * Finds a person by email address or phone number.
 */

import { Command } from "commander";
import { createClient, AiArkApiError } from "../client/index.js";
import { formatOutput } from "../io/index.js";
import type { OutputFormat } from "../io/index.js";
import type {
  ReverseLookupRequest,
  ReverseLookupResponse,
} from "../types/api.js";

export function peopleLookupCommand(): Command {
  return new Command("lookup")
    .description("Reverse lookup by email or phone")
    .requiredOption("--email <email>", "Email address to look up")
    .option("--format <type>", "Output format: json, csv, table", "json")
    .option("--clay-table <id>", "Push results to a Clay table")
    .action(async (opts) => {
      try {
        const client = createClient();
        const format = opts.format as OutputFormat;

        const body: ReverseLookupRequest = {
          kind: "CONTACT",
          search: opts.email,
        };

        const result = await client.post<ReverseLookupResponse>(
          "/people/reverse-lookup",
          body,
        );

        if (opts.clayTable) {
          const { pushToClay } = await import("../io/index.js");
          pushToClay(opts.clayTable, [result]);
        }
        formatOutput(result, format);
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
