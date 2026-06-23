#!/usr/bin/env bun
import { Command } from "commander";
import { loadEnvFromDirs, defaultEnvDirs } from "./env-loader.js";

// Load .env so callers don't need to inline the key
// Search: CLI's own directory, then CWD. No hardcoded user paths.
const env: Record<string, string> = {};
const searched = loadEnvFromDirs(defaultEnvDirs(), env);

// Merge loaded values into process.env (first writer wins — pre-set env vars take priority)
for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) process.env[k] = v;
}

// Expose searched dirs so createClient() can report them in errors
process.env._AI_ARK_ENV_SEARCHED = searched.join(";");

import { creditsCommand } from "./commands/credits.js";
import { companiesSearchCommand } from "./commands/companies-search.js";
import { peopleSearchCommand } from "./commands/people-search.js";
import { peopleLookupCommand } from "./commands/people-lookup.js";
import { peoplePhoneCommand } from "./commands/people-phone.js";
import { peopleAnalyzeCommand } from "./commands/people-analyze.js";
import { peopleExportCommand } from "./commands/people-export.js";
import { peopleFindEmailsCommand } from "./commands/people-find-emails.js";
import { peopleExportOneCommand } from "./commands/people-export-one.js";
import { peoplePipelineCommand } from "./commands/people-pipeline.js";
import { startCommand } from "./commands/start.js";

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

// Interactive guided workflow
program.addCommand(startCommand());

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
people.addCommand(peoplePipelineCommand());

program.parse();
