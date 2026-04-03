/**
 * People export-one command — POST /people/export/single.
 * Enriches a single person by AI Ark ID or LinkedIn URL.
 * Synchronous — returns immediately, no polling.
 */

import { Command } from "commander";
import { createClient, AiArkApiError } from "../client/index.js";
import { formatOutput } from "../io/index.js";
import type { OutputFormat } from "../io/index.js";
import type { ExportSingleRequest } from "../types/api.js";

export function peopleExportOneCommand(): Command {
  return new Command("export-one")
    .description("Enrich a single person by AI Ark ID or LinkedIn URL")
    .option("--id <aiArkPersonId>", "AI Ark person ID (from people search results)")
    .option("--linkedin <url>", "LinkedIn profile URL")
    .option("--format <type>", "Output format: json, csv, table", "json")
    .option("--clay-table <id>", "Push result to a Clay table")
    .action(async (opts) => {
      if (!opts.id && !opts.linkedin) {
        console.error("Error: provide --id or --linkedin");
        process.exit(1);
      }

      try {
        const client = createClient();
        const format = opts.format as OutputFormat;

        const body: ExportSingleRequest = {};
        if (opts.id) body.id = opts.id;
        if (opts.linkedin) body.url = opts.linkedin;

        const result = await client.post<Record<string, unknown>>(
          "/people/export/single",
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
