#!/usr/bin/env bun
import { Command } from "commander";
import { creditsCommand } from "./commands/credits.js";
import { companiesSearchCommand } from "./commands/companies-search.js";
import { peopleSearchCommand } from "./commands/people-search.js";
import { peopleLookupCommand } from "./commands/people-lookup.js";
import { peoplePhoneCommand } from "./commands/people-phone.js";
import { peopleAnalyzeCommand } from "./commands/people-analyze.js";

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

// Async commands (Phase 3 — not yet implemented)
people
  .command("export")
  .description("Bulk export with email discovery")
  .action(() => {
    console.error("Not implemented yet");
    process.exit(1);
  });

people
  .command("find-emails")
  .description("Find emails from search track ID")
  .action(() => {
    console.error("Not implemented yet");
    process.exit(1);
  });

program.parse();
