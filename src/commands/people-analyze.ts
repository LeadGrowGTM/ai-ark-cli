/**
 * People personality analysis command — POST /people/analysis.
 * Returns AI personality analysis based on LinkedIn profile data.
 */

import { Command } from "commander";
import { createClient, AiArkApiError } from "../client/index.js";
import { formatOutput } from "../io/index.js";
import type { OutputFormat } from "../io/index.js";
import type {
  PersonalityAnalysisRequest,
  PersonalityAnalysisResponse,
} from "../types/api.js";

export function peopleAnalyzeCommand(): Command {
  return new Command("analyze")
    .description("AI personality analysis")
    .requiredOption("--linkedin <url>", "LinkedIn profile URL to analyze")
    .option("--format <type>", "Output format: json, csv, table", "json")
    .action(async (opts) => {
      try {
        const client = createClient();
        const format = opts.format as OutputFormat;

        const body: PersonalityAnalysisRequest = {
          url: opts.linkedin,
        };

        const result = await client.post<PersonalityAnalysisResponse>(
          "/people/analysis",
          body,
        );
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
