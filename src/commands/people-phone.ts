/**
 * People phone finder command — POST /people/mobile-phone-finder.
 * Three search pathways: LinkedIn URL, domain+name, or type specification.
 */

import { Command } from "commander";
import { createClient, AiArkApiError } from "../client/index.js";
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
    .action(async (opts) => {
      try {
        if (!opts.linkedin && !(opts.domain && opts.name)) {
          console.error("Error: Provide --linkedin OR both --domain and --name");
          process.exit(1);
        }

        const client = createClient();

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
