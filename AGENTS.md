# AI Ark CLI

TypeScript/Bun CLI wrapping the AI Ark API — search 400M+ people and 69M+ companies, export verified emails, push results to Clay.

## Tech Stack

- **Runtime:** Bun 1.3.9+ (not Node — use `bun`, not `node`)
- **Language:** TypeScript (ESM, `"type": "module"`)
- **CLI framework:** Commander.js
- **API:** AI Ark REST — base URL in `src/client/http.ts`

## Commands

```bash
# First-time setup (installs deps, prompts for API key, writes .env)
bun run setup

# Development — run TypeScript directly, no build step needed
bun run src/index.ts <command> [flags]

# Build compiled binary to dist/
bun run build
# Produces dist/index.js — run as: bun dist/index.js <command>

# Get help on any command
bun run src/index.ts people search --help
```

No test runner is configured yet. Verify changes manually with `bun run src/index.ts credits` against a real API key.

## Architecture

```
src/
  index.ts              Entry point — loads .env, registers all commands
  commands/             One file per CLI command (people-search, people-export, etc.)
  client/
    http.ts             AiArkClient — authenticated fetch wrapper
    poller.ts           Async job poller (polls every 3s until DONE/FAILED)
    rate-limiter.ts     5 req/sec burst limiter
  io/
    input.ts            CSV/stdin ingestion, --input + --domain-col parsing
    format.ts           Output formatters: json | csv | table
    clay.ts             --clay-table push via Clay CLI subprocess
  filters.ts            Shared flag-to-payload builders (seniority, titles, etc.)
  url-builder.ts        Builds ai-ark.com review URLs from filter state
  types/                API request/response shapes (TypeScript only, no runtime validation)
scripts/
  setup.ts              Interactive setup wizard
docs/
  api-reference/        Markdown docs for each API endpoint
  url-grammar.md        AI Ark URL parameter reference
.claude/skills/         ai-ark-search skill for Claude use
.planning/              GSD milestone state (v1.0 complete)
```

## Conventions

- **Async commands** (`people export`, `people find-emails`) hit an async API endpoint and poll via `poller.ts` until terminal state. Progress goes to stderr; data goes to stdout. This keeps piped output clean.
- **Review URLs always print to stderr** after every real search — never pollutes `--format csv > file.csv` pipelines. Suppress with `--no-review-url`.
- **`--dry-run` on any search command** prints the review URL and request payload, then exits — zero API credits spent. Use this before large exports.
- **Domains don't round-trip through review URLs** — platform limitation. When `--domain` or `--input` is used, the CLI writes domains to `ai-ark-domains-paste.md` in CWD and logs the path to stderr.

## Gotchas

**API key loading order:** `index.ts` searches for `.env` in: (1) CLI's own directory, (2) hardcoded fallback `C:/Users/mitch/Everything_CC/ai-ark-cli`, (3) CWD. Put `.env` at repo root. Key: `AI_ARK_API_KEY`.

**Rate limiter:** 5 req/sec enforced client-side. Burst-testing will queue, not drop. Don't disable it — the API will 429 without it.

**Clay push (`--clay-table`):** Requires the `clay` CLI installed and authenticated separately. The push writes a temp CSV and calls `clay rows add`. If Clay CLI isn't on PATH, this silently fails — check stderr.

**`people export` is async:** Submits a job, then polls every 3 seconds. Large exports (10K records) take minutes. Don't cancel mid-poll — the job keeps running server-side and burns credits.

**`people find-emails` requires a `trackId`:** Run `people search` first, capture the `trackId` from the response, then pass it to `people find-emails --track-id <id>`.

**Build output in `dist/`** is Bun-compiled — it's the installable binary (`bin: ai-ark`). Dev work always runs against `src/index.ts` directly.
