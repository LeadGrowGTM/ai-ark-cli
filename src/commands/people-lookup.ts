/**
 * People reverse lookup command — POST /people/reverse-lookup.
 * Finds a person by email address or phone number.
 */

import { Command } from "commander";
import { createClient, AiArkApiError } from "../client/index.js";
import type {
  ReverseLookupRequest,
  ReverseLookupResponse,
} from "../types/api.js";

export function peopleLookupCommand(): Command {
  return new Command("lookup")
    .description("Reverse lookup by email or phone")
    .requiredOption("--email <email>", "Email address to look up")
    .action(async (opts) => {
      try {
        const client = createClient();

        const body: ReverseLookupRequest = {
          kind: "CONTACT",
          search: opts.email,
        };

        const result = await client.post<ReverseLookupResponse>(
          "/people/reverse-lookup",
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
