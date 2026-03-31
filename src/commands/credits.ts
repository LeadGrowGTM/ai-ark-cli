/**
 * Credits command — checks account credit balance via GET /payments/credits.
 */

import { Command } from "commander";
import { createClient, AiArkApiError } from "../client/index.js";
import { formatOutput } from "../io/index.js";
import type { OutputFormat } from "../io/index.js";
import type { CreditResponse } from "../types/api.js";

export function creditsCommand(): Command {
  return new Command("credits")
    .description("Check account credit balance")
    .option("--format <type>", "Output format: json, csv, table", "json")
    .action(async (opts) => {
      try {
        const client = createClient();
        const result = await client.get<CreditResponse>("/payments/credits");
        formatOutput(result, opts.format as OutputFormat);
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
