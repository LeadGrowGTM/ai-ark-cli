#!/usr/bin/env bun
/**
 * Interactive guided workflow for AI Ark enrichment.
 * Flow: CSV → rough persona → spot-check (real API) → observability → domain paste.
 *
 * Spot-check samples ~5 domains and searches broadly by department/seniority
 * matching the persona. Shows what titles actually exist so the user (or Claude)
 * can build precise title tiers based on real org structures — local biz have
 * Owners, SaaS has VPs, factories have Plant Managers, etc.
 */

import { Command } from "commander";
import { existsSync, readdirSync } from "fs";
import { resolve } from "path";
import { createClient } from "../client/index.js";
import { readCsvFile } from "../io/index.js";
import { buildAccountFilter, buildContactFilter } from "../filters.js";
import { printReviewUrl } from "../url-builder.js";
import type { FilterOpts } from "../filters.js";
import type { PeopleSearchRequest, PeopleSearchResponse } from "../types/api.js";
import type { Person } from "../types/responses.js";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const YELLOW = "\x1b[33m";

function log(msg: string) { console.log(msg); }
function ok(msg: string) { log(`${GREEN}✓${RESET} ${msg}`); }
function info(msg: string) { log(`${CYAN}→${RESET} ${msg}`); }
function err(msg: string) { log(`${RED}✗${RESET} ${msg}`); }
function dim(msg: string) { log(`${DIM}${msg}${RESET}`); }
function warn(msg: string) { log(`${YELLOW}⚠${RESET} ${msg}`); }
function hr() { log("─────────────────────────────────────────────"); }

interface PersonaMapping {
  departments: string[];
  seniorities: string[];
  label: string;
}

const PERSONA_MAP: Record<string, PersonaMapping> = {
  sales: {
    departments: ["sales", "business_development"],
    seniorities: ["founder", "c_suite", "vp", "director", "head", "manager"],
    label: "Sales & Revenue",
  },
  marketing: {
    departments: ["marketing", "communications"],
    seniorities: ["founder", "c_suite", "vp", "director", "head", "manager"],
    label: "Marketing",
  },
  operations: {
    departments: ["operations", "finance"],
    seniorities: ["founder", "c_suite", "vp", "director", "head", "manager"],
    label: "Operations & Finance",
  },
  technical: {
    departments: ["engineering", "information_technology", "data"],
    seniorities: ["founder", "c_suite", "vp", "director", "head", "manager"],
    label: "Technical & Engineering",
  },
  leadership: {
    departments: [],
    seniorities: ["founder", "c_suite", "vp", "director"],
    label: "Senior Leadership (any dept)",
  },
  owner: {
    departments: [],
    seniorities: ["founder", "c_suite"],
    label: "Owners & C-Suite",
  },
};

export function startCommand(): Command {
  return new Command("start")
    .description("Interactive guided workflow — CSV → persona → spot-check → observability → domain paste")
    .action(async () => {
      log("");
      log(`${BOLD}AI Ark — Guided Enrichment${RESET}`);
      hr();
      log("");

      // ── Step 1: Health check ──────────────────────────────────────────
      info("Checking API connection...");
      let client;
      try {
        client = createClient();
        const creditResult = await client.get<{ total: number }>("/payments/credits");
        ok(`API connected. ${creditResult.total} credits available`);
      } catch (e: unknown) {
        err(`API check failed: ${e instanceof Error ? e.message : e}`);
        info("Run: bun run setup");
        process.exit(1);
      }
      log("");

      // ── Step 2: CSV selection ─────────────────────────────────────────
      const csvFiles = findCsvFiles();
      if (csvFiles.length > 0) {
        log(`${BOLD}CSV files in current directory:${RESET}`);
        csvFiles.forEach((f, i) => log(`  ${DIM}${i + 1}.${RESET} ${f}`));
        log("");
      }

      const csvInput = askRequired("Which CSV? (path or number): ");
      let csvPath: string;
      const num = parseInt(csvInput, 10);
      if (!isNaN(num) && num >= 1 && num <= csvFiles.length) {
        csvPath = csvFiles[num - 1];
      } else {
        csvPath = csvInput;
      }

      const resolved = resolve(csvPath);
      if (!existsSync(resolved)) {
        err(`File not found: ${resolved}`);
        process.exit(1);
      }
      ok(`Found: ${resolved}`);

      // ── Step 3: Column detection ──────────────────────────────────────
      const records = readCsvFile(resolved);
      const headers = Object.keys(records[0]);
      log("");
      log(`${BOLD}Columns:${RESET} ${headers.join(", ")}`);
      log(`${BOLD}Rows:${RESET} ${records.length}`);
      log("");

      const domainGuess = guessColumn(headers);
      let domainCol: string;
      if (domainGuess) {
        const confirm = prompt(`Domain column? [${domainGuess}]: `);
        domainCol = confirm?.trim() || domainGuess;
      } else {
        domainCol = askRequired("Which column has company domains?: ");
      }

      if (!headers.includes(domainCol)) {
        err(`Column "${domainCol}" not found. Available: ${headers.join(", ")}`);
        process.exit(1);
      }

      const domains = records
        .map((r) => r[domainCol])
        .filter(Boolean)
        .map((d) => d.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/+$/, ""));
      const unique = [...new Set(domains)];

      ok(`${unique.length} unique domains (${domains.length} total rows)`);
      log("");

      // ── Step 4: Rough persona ─────────────────────────────────────────
      hr();
      log(`${BOLD}Who are you looking for?${RESET}`);
      log("");
      log("  Persona shortcuts:");
      Object.entries(PERSONA_MAP).forEach(([key, val]) => {
        log(`    ${CYAN}${key}${RESET} — ${val.label}`);
      });
      log("");
      log("  Or type a freeform description (e.g. 'plant managers', 'agency owners')");
      log("");

      const personaInput = askRequired("Rough persona: ");
      const personaKey = personaInput.toLowerCase().trim();

      let mapping = PERSONA_MAP[personaKey];
      let freeformTitles: string[] | undefined;

      if (!mapping) {
        freeformTitles = personaInput.split(",").map((t) => t.trim()).filter(Boolean);
        log("");
        info(`No preset for "${personaInput}" — spot-check will search by title keywords`);
        mapping = PERSONA_MAP["leadership"];
      } else {
        log("");
        ok(`Using ${mapping.label} filters for spot-check`);
      }

      // ── Step 5: Spot-check (real API calls) ───────────────────────────
      hr();
      log(`${BOLD}Spot-Check — Sampling 5 Domains${RESET}`);
      log("");
      info("Real API calls — uses credits. Shows what roles exist at sample companies.");
      log("");

      const sampleDomains = pickSample(unique, 5);
      const allSpotResults: SpotResult[] = [];

      for (const domain of sampleDomains) {
        const filterOpts: FilterOpts = {
          domain: [domain],
          matchMode: "SMART",
        } as FilterOpts;

        if (freeformTitles) {
          filterOpts.keyword = freeformTitles;
        } else {
          if (mapping.departments.length > 0) {
            filterOpts.department = mapping.departments;
          }
          if (mapping.seniorities.length > 0) {
            filterOpts.seniority = mapping.seniorities;
          }
        }

        const body: PeopleSearchRequest = {
          page: 0,
          size: 25,
        };

        const account = buildAccountFilter(filterOpts, "people");
        if (account) body.account = account;
        const contact = buildContactFilter(filterOpts);
        if (contact) body.contact = contact;

        try {
          const result = await client.post<PeopleSearchResponse>("/people", body);
          const people = result.content as Person[];
          const companyName = people[0]?.company?.summary?.name || domain;
          const empCount = people[0]?.company?.summary?.staff?.total;

          const spot: SpotResult = {
            domain,
            companyName,
            employees: empCount || 0,
            total: result.totalElements || people.length,
            titles: [],
            departments: [],
            seniorities: [],
          };

          for (const p of people) {
            if (p.profile?.title) spot.titles.push(p.profile.title);
            if (p.department?.departments) spot.departments.push(...p.department.departments);
            if (p.department?.seniority) spot.seniorities.push(p.department.seniority);
          }

          spot.titles = [...new Set(spot.titles)];
          spot.departments = [...new Set(spot.departments)];
          spot.seniorities = [...new Set(spot.seniorities)];

          allSpotResults.push(spot);

          const empLabel = empCount ? ` (${empCount} emp)` : "";
          log(`  ${GREEN}${companyName}${RESET}${empLabel} — ${people.length} people found`);
          if (spot.titles.length > 0) {
            dim(`    Titles: ${spot.titles.slice(0, 8).join(", ")}${spot.titles.length > 8 ? ` (+${spot.titles.length - 8} more)` : ""}`);
          }
          if (spot.seniorities.length > 0) {
            dim(`    Seniority: ${spot.seniorities.join(", ")}`);
          }
          if (spot.departments.length > 0) {
            dim(`    Departments: ${spot.departments.join(", ")}`);
          }
        } catch (e: unknown) {
          warn(`${domain}: ${e instanceof Error ? e.message : "failed"}`);
          allSpotResults.push({
            domain,
            companyName: domain,
            employees: 0,
            total: 0,
            titles: [],
            departments: [],
            seniorities: [],
          });
        }
        log("");
      }

      // ── Step 6: Spot-check summary ────────────────────────────────────
      hr();
      log(`${BOLD}Spot-Check Summary${RESET}`);
      log("");

      const allTitles = allSpotResults.flatMap((r) => r.titles);
      const titleCounts = countOccurrences(allTitles);
      const allDepts = allSpotResults.flatMap((r) => r.departments);
      const deptCounts = countOccurrences(allDepts);
      const allSeniorities = allSpotResults.flatMap((r) => r.seniorities);
      const senCounts = countOccurrences(allSeniorities);

      if (titleCounts.length > 0) {
        log(`${BOLD}Top titles found:${RESET}`);
        titleCounts.slice(0, 15).forEach(([title, count]) => {
          log(`  ${count > 1 ? GREEN : ""}${title}${RESET} ${DIM}(×${count})${RESET}`);
        });
        log("");
      }

      if (deptCounts.length > 0) {
        log(`${BOLD}Departments:${RESET} ${deptCounts.map(([d, c]) => `${d} (×${c})`).join(", ")}`);
        log("");
      }

      if (senCounts.length > 0) {
        log(`${BOLD}Seniority levels:${RESET} ${senCounts.map(([s, c]) => `${s} (×${c})`).join(", ")}`);
        log("");
      }

      const bigCompanies = allSpotResults.filter((r) => r.employees >= 250);
      if (bigCompanies.length > 0) {
        warn(`${bigCompanies.length} companies have 250+ employees:`);
        bigCompanies.forEach((r) => {
          log(`    ${r.companyName} (${r.employees} emp) — ${r.total} total matches`);
        });
        log("");
        info("Large companies may return too many results per domain.");
        info("Consider filtering by department or specific titles instead of broad seniority.");
        log("");
      }

      // ── Step 7: Observability URL ─────────────────────────────────────
      hr();
      log(`${BOLD}Observability — Review URL${RESET}`);
      log("");

      const reviewOpts: FilterOpts = {
        domain: unique,
        matchMode: "SMART",
      } as FilterOpts;

      if (freeformTitles) {
        reviewOpts.keyword = freeformTitles;
      } else {
        if (mapping.departments.length > 0) reviewOpts.department = mapping.departments;
        if (mapping.seniorities.length > 0) reviewOpts.seniority = mapping.seniorities;
      }

      printReviewUrl(reviewOpts, "people");

      info("Review URL loads all filters EXCEPT domains (platform limitation).");
      info("Open link → verify filters look correct.");
      log("");

      // ── Step 8: Domain paste list ─────────────────────────────────────
      hr();
      log(`${BOLD}Domain Paste List — ${unique.length} domains${RESET}`);
      log("");
      log("Copy this comma-separated list → paste into AI Ark bulk include box:");
      log("");
      log(`${CYAN}┌─────────────────────────────────────────────┐${RESET}`);
      log("");
      log(unique.join(", "));
      log("");
      log(`${CYAN}└─────────────────────────────────────────────┘${RESET}`);
      log("");
      ok(`${unique.length} domains ready to paste`);
      info(`Also written to ai-ark-domains-paste.md (from review URL step)`);
      log("");

      // ── Step 9: Next steps ────────────────────────────────────────────
      hr();
      log(`${BOLD}What's Next${RESET}`);
      log("");
      log("  1. Review the titles found above — pick which ones to target");
      log("  2. Open the review URL → paste domains into bulk include box");
      log("  3. Run the actual search with your chosen titles:");
      log("");
      const exampleTitles = titleCounts.slice(0, 4).map(([t]) => `"${t}"`).join(" ");
      dim(`     bun run src/index.ts people search \\`);
      dim(`       --input "${csvPath}" --domain-col "${domainCol}" \\`);
      dim(`       --title ${exampleTitles || '"CEO" "Founder" "VP Sales"'} \\`);
      dim(`       --exclude-title "Intern" "Assistant" \\`);
      dim(`       --format csv > contacts.csv`);
      log("");
      hr();
      ok(`${BOLD}Spot-check done. Pick your titles and go.${RESET}`);
      log("");
    });
}

interface SpotResult {
  domain: string;
  companyName: string;
  employees: number;
  total: number;
  titles: string[];
  departments: string[];
  seniorities: string[];
}

function askRequired(question: string): string {
  const answer = prompt(question);
  if (!answer?.trim()) {
    err("Required input. Exiting.");
    process.exit(1);
  }
  return answer.trim();
}

function guessColumn(headers: string[]): string | undefined {
  const candidates = ["domain", "website", "company_domain", "url", "site", "company_website", "Domain", "Website"];
  for (const c of candidates) {
    if (headers.includes(c)) return c;
  }
  const lower = headers.map((h) => h.toLowerCase());
  for (const c of ["domain", "website", "company_domain", "url", "site"]) {
    const idx = lower.indexOf(c);
    if (idx !== -1) return headers[idx];
  }
  return undefined;
}

function findCsvFiles(): string[] {
  try {
    return readdirSync(".")
      .filter((f) => f.endsWith(".csv"))
      .slice(0, 10);
  } catch {
    return [];
  }
}

function pickSample(items: string[], count: number): string[] {
  if (items.length <= count) return [...items];
  const step = Math.floor(items.length / count);
  const sample: string[] = [];
  for (let i = 0; i < count; i++) {
    sample.push(items[i * step]);
  }
  return sample;
}

function countOccurrences(items: string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
