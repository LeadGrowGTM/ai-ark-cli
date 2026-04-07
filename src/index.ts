#!/usr/bin/env bun
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { Command } from "commander";

// Load .env so callers don't need to inline the key
// Try CLI's own directory first, then known install, then CWD as fallback
const envSearched: string[] = [];

function loadEnvFile(dir: string): boolean {
  envSearched.push(dir);
  try {
    const p = resolve(dir, ".env");
    const lines = readFileSync(p, "utf-8").replace(/\r/g, "").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]]) {
        let val = match[2];
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[match[1]] = val;
      }
    }
    return true;
  } catch {
    return false;
  }
}

const cliDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (!loadEnvFile(cliDir)) {
  // Hardcoded fallback for known install location
  const knownInstall = resolve("C:/Users/mitch/Everything_CC/ai-ark-cli");
  if (cliDir !== knownInstall && !loadEnvFile(knownInstall)) {
    loadEnvFile(process.cwd());
  }
}

// Expose searched dirs so createClient() can report them in errors
process.env._AI_ARK_ENV_SEARCHED = envSearched.join(";");

import { creditsCommand } from "./commands/credits.js";
import { companiesSearchCommand } from "./commands/companies-search.js";
import { peopleSearchCommand } from "./commands/people-search.js";
import { peopleLookupCommand } from "./commands/people-lookup.js";
import { peoplePhoneCommand } from "./commands/people-phone.js";
import { peopleAnalyzeCommand } from "./commands/people-analyze.js";
import { peopleExportCommand } from "./commands/people-export.js";
import { peopleFindEmailsCommand } from "./commands/people-find-emails.js";
import { peopleExportOneCommand } from "./commands/people-export-one.js";

// Global error handler for uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

const program = new Command();

program
  .name("ai-ark")
  .description("AI Ark API CLI — search 400M+ people and 69M+ companies")
  .version("0.1.0");

// Credits command
program.addCommand(creditsCommand());

// Companies command group
const companies = program
  .command("companies")
  .description("Company search and lookup");

companies.addCommand(companiesSearchCommand());

// People command group
const people = program
  .command("people")
  .description("People search, lookup, and enrichment");

people.addCommand(peopleSearchCommand());
people.addCommand(peopleLookupCommand());
people.addCommand(peoplePhoneCommand());
people.addCommand(peopleAnalyzeCommand());
people.addCommand(peopleExportCommand());
people.addCommand(peopleFindEmailsCommand());
people.addCommand(peopleExportOneCommand());

program.parse();
