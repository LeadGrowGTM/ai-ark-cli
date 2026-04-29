/**
 * People export-one command — POST /people/export/single.
 * Enriches a single person by AI Ark ID or LinkedIn URL.
 * Synchronous — returns immediately, no polling.
 */

import { Command } from "commander";
import { createClient, AiArkApiError } from "../client/index.js";
import { formatOutput, persistResults, filterByProfile } from "../io/index.js";
import type { OutputFormat, Profile } from "../io/index.js";
import type { ExportSingleRequest } from "../types/api.js";

export function peopleExportOneCommand(): Command {
  return new Command("export-one")
    .description("Enrich a single person by AI Ark ID or LinkedIn URL")
    .option("--id <aiArkPersonId>", "AI Ark person ID (from people search results)")
    .option("--linkedin <url>", "LinkedIn profile URL")
    .option("--format <type>", "Output format: json, csv, table", "json")
    .option("--profile <name>", "Output shape: outbound (Tier 1 fields, default) or raw (full API response)", "outbound")
    .option("--clay-table <id>", "Push result to a Clay table")
    .option("--output <file>", "Write results to this exact path instead of ~/.ai-ark/results/")
    .option("--no-save", "Skip auto-save to ~/.ai-ark/results/")
    .action(async (opts) => {
      if (!opts.id && !opts.linkedin) {
        console.error("Error: provide --id or --linkedin");
        process.exit(1);
      }

      try {
        const client = createClient();
        const format = opts.format as OutputFormat;

        const profile = opts.profile as Profile;
        if (profile !== "outbound" && profile !== "raw") {
          console.error(`Error: --profile must be "outbound" or "raw" (got "${profile}")`);
          process.exit(1);
        }

        const body: ExportSingleRequest = {};
        if (opts.id) body.id = opts.id;
        if (opts.linkedin) body.url = opts.linkedin;

        const result = await client.post<Record<string, unknown>>(
          "/people/export/single",
          body,
        );

        const filtered = filterByProfile(result, "person", profile);
        persistResults({
          data: filtered,
          command: "people-export-one",
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
