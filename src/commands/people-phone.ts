/**
 * People phone finder command — POST /people/mobile-phone-finder.
 * Three search pathways: LinkedIn URL, domain+name, or type specification.
 */

import { Command } from "commander";
import { createClient, AiArkApiError } from "../client/index.js";
import { formatOutput, persistResults } from "../io/index.js";
import type { OutputFormat } from "../io/index.js";
import type {
  MobilePhoneRequest,
  MobilePhoneResponse,
} from "../types/api.js";

export function peoplePhoneCommand(): Command {
  return new Command("phone")
    .description("Find mobile phone numbers")
    .option("--linkedin <url>", "LinkedIn profile URL")
    .option("--domain <domain>", "Company domain (use with --name)")
    .option("--name <name>", "Person full name (use with --domain)")
    .option("--type <type>", "Phone type to find", "personal")
    .option("--format <type>", "Output format: json, csv, table", "json")
    .option("--clay-table <id>", "Push results to a Clay table")
    .option("--output <file>", "Write results to this exact path instead of ~/.ai-ark/results/")
    .option("--no-save", "Skip auto-save to ~/.ai-ark/results/")
    .action(async (opts) => {
      try {
        if (!opts.linkedin && !(opts.domain && opts.name)) {
          console.error("Error: Provide --linkedin OR both --domain and --name");
          process.exit(1);
        }

        const client = createClient();
        const format = opts.format as OutputFormat;

        const body: MobilePhoneRequest = {
          type: opts.type,
        };

        if (opts.linkedin) {
          body.linkedinUrl = opts.linkedin;
        }
        if (opts.domain) {
          body.domain = opts.domain;
        }
        if (opts.name) {
          body.name = opts.name;
        }

        const result = await client.post<MobilePhoneResponse>(
          "/people/mobile-phone-finder",
          body,
        );

        const dataToOutput = format === "json" ? result : result.phones;
        persistResults({
          data: dataToOutput,
          command: "people-phone",
          output: opts.output,
          noSave: opts.save === false,
        });
        if (opts.clayTable) {
          const { pushToClay } = await import("../io/index.js");
          pushToClay(opts.clayTable, result.phones);
        }
        formatOutput(dataToOutput, format);
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
