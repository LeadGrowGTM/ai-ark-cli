#!/usr/bin/env bun
import { Command } from "commander";

// Validate API key is available (warn early, not on every command)
if (!process.env.AI_ARK_API_KEY) {
  console.error("Error: AI_ARK_API_KEY environment variable is not set");
  process.exit(1);
}

const program = new Command();

program
  .name("ai-ark")
  .description("AI Ark API CLI — search 400M+ people and 69M+ companies")
  .version("0.1.0");

// Credits command
program
  .command("credits")
  .description("Check account credit balance")
  .action(() => {
    console.error("Not implemented yet");
    process.exit(1);
  });

// Companies command group
const companies = program
  .command("companies")
  .description("Search 69M+ company profiles");

companies
  .command("search")
  .description("Search companies by filters")
  .action(() => {
    console.error("Not implemented yet");
    process.exit(1);
  });

// People command group
const people = program
  .command("people")
  .description("Search and enrich 400M+ people profiles");

people
  .command("search")
  .description("Search people by account and contact filters")
  .action(() => {
    console.error("Not implemented yet");
    process.exit(1);
  });

people
  .command("lookup")
  .description("Reverse people lookup by email or phone")
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
  .description("AI personality analysis from LinkedIn profile")
  .action(() => {
    console.error("Not implemented yet");
    process.exit(1);
  });

people
  .command("export")
  .description("Async bulk export with email discovery (max 10K)")
  .action(() => {
    console.error("Not implemented yet");
    process.exit(1);
  });

people
  .command("find-emails")
  .description("Find emails by people search track ID")
  .action(() => {
    console.error("Not implemented yet");
    process.exit(1);
  });

program.parse();
