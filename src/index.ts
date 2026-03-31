#!/usr/bin/env bun
import { Command } from "commander";
import { creditsCommand } from "./commands/credits.js";

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

companies
  .command("search")
  .description("Search 69M+ company profiles")
  .action(() => {
    console.error("Not implemented yet");
    process.exit(1);
  });

// People command group
const people = program
  .command("people")
  .description("People search, lookup, and enrichment");

people
  .command("search")
  .description("Search 400M+ people profiles")
  .action(() => {
    console.error("Not implemented yet");
    process.exit(1);
  });

people
  .command("lookup")
  .description("Reverse lookup by email or phone")
  .action(() => {
    console.error("Not implemented yet");
    process.exit(1);
  });

people
  .command("phone")
  .description("Find mobile phone numbers")
  .action(() => {
    console.error("Not implemented yet");
    process.exit(1);
  });

people
  .command("analyze")
  .description("AI personality analysis")
  .action(() => {
    console.error("Not implemented yet");
    process.exit(1);
  });

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
