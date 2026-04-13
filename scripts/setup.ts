#!/usr/bin/env bun
/**
 * AI Ark CLI setup wizard.
 * Run: bun run setup
 */

import { existsSync, writeFileSync } from "fs";
import { spawnSync } from "child_process";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";

function log(msg: string) { console.log(msg); }
function ok(msg: string) { log(`${GREEN}✓${RESET} ${msg}`); }
function info(msg: string) { log(`${CYAN}→${RESET} ${msg}`); }
function err(msg: string) { log(`${RED}✗${RESET} ${msg}`); }
function dim(msg: string) { log(`${DIM}${msg}${RESET}`); }

log("");
log(`${BOLD}AI Ark CLI — Setup Wizard${RESET}`);
log("─────────────────────────────────────");
log("");

// ── Step 1: Check Bun ────────────────────────────────────────────────────────

const bunVersion = spawnSync("bun", ["--version"], { encoding: "utf8" });
if (bunVersion.error || bunVersion.status !== 0) {
  err("Bun is not installed.");
  info("Install it: https://bun.sh");
  dim("  curl -fsSL https://bun.sh/install | bash");
  process.exit(1);
}
ok(`Bun ${bunVersion.stdout.trim()} detected`);

// ── Step 2: Install dependencies ─────────────────────────────────────────────

info("Installing dependencies...");
const install = spawnSync("bun", ["install"], { stdio: "inherit" });
if (install.status !== 0) {
  err("bun install failed. Check the output above.");
  process.exit(1);
}
ok("Dependencies installed");

// ── Step 3: API key ───────────────────────────────────────────────────────────

log("");

let apiKey: string | undefined;

if (existsSync(".env")) {
  const existing = Bun.file(".env").toString();
  const match = existing.match(/AI_ARK_API_KEY=(.+)/);
  if (match && match[1].trim()) {
    ok(".env already exists with API key — skipping");
    apiKey = match[1].trim();
  }
}

if (!apiKey) {
  log(`${BOLD}Step: Add your AI Ark API key${RESET}`);
  dim("  Get your key at: https://app.ai-ark.com/settings/api-management/dashboard");
  log("");

  const input = prompt("Paste your API key: ");

  if (!input || !input.trim()) {
    err("No API key entered. Re-run setup when you have your key.");
    log("");
    dim("  bun run setup");
    log("");
    process.exit(1);
  }

  apiKey = input.trim();
  writeFileSync(".env", `AI_ARK_API_KEY=${apiKey}\n`, "utf8");
  ok(".env created");
}

// ── Step 4: Verify ────────────────────────────────────────────────────────────

log("");
info("Verifying API key...");
const verify = spawnSync("bun", ["run", "src/index.ts", "credits"], {
  encoding: "utf8",
  env: { ...process.env, AI_ARK_API_KEY: apiKey },
});

if (verify.status !== 0) {
  err("API key verification failed.");
  log("");
  log(verify.stderr || verify.stdout || "");
  dim("  Double-check your key at: https://app.ai-ark.com/settings/api-management/dashboard");
  process.exit(1);
}

log(verify.stdout.trim());
log("");
log("─────────────────────────────────────");
ok(`${BOLD}Setup complete.${RESET}`);
log("");
log("Run your first search:");
dim('  bun run src/index.ts people search --title "VP Sales" --employees 50-500 --seniority vp director --size 10 --format table');
log("");
log("Verify a search for free before spending credits:");
dim('  bun run src/index.ts people search --title "VP Sales" --seniority vp director --dry-run');
log("");
