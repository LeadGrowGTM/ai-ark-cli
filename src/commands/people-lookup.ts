/**
 * People reverse lookup command — POST /people/reverse-lookup.
 * Finds a person by email address or phone number.
 */

import { Command } from "commander";
import { createClient, AiArkApiError } from "../client/index.js";
import { formatOutput, persistResults, filterByProfile } from "../io/index.js";
import type { OutputFormat, Profile } from "../io/index.js";
import type {
  ReverseLookupRequest,
  ReverseLookupResponse,
} from "../types/api.js";

export function peopleLookupCommand(): Command {
  return new Command("lookup")
    .description("Reverse lookup by email or phone")
    .requiredOption("--email <email>", "Email address to look up")
    .option("--format <type>", "Output format: json, csv, table", "json")
    .option("--profile <name>", "Output shape: outbound (Tier 1 fields, default) or raw (full API response)", "outbound")
    .option("--clay-table <id>", "Push results to a Clay table")
    .option("--output <file>", "Write results to this exact path instead of ~/.ai-ark/results/")
    .option("--no-save", "Skip auto-save to ~/.ai-ark/results/")
    .action(async (opts) => {
      try {
        const client = createClient();
        const format = opts.format as OutputFormat;

        const profile = opts.profile as Profile;
        if (profile !== "outbound" && profile !== "raw") {
          console.error(`Error: --profile must be "outbound" or "raw" (got "${profile}")`);
          process.exit(1);
        }

        const body: ReverseLookupRequest = {
          kind: "CONTACT",
          search: opts.email,
        };

        const result = await client.post<ReverseLookupResponse>(
          "/people/reverse-lookup",
          body,
        );

        const filtered = filterByProfile(result, "person", profile);
        persistResults({
          data: filtered,
          command: "people-lookup",
          output: opts.output,
          noSave: opts.save === false,
        });
        if (opts.clayTable) {
          const { pushToClay } = await import("../io/index.js");
          pushToClay(opts.clayTable, [filtered]);
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
