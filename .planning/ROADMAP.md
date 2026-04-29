# Roadmap: AI Ark CLI

**Created:** 2026-03-31
**Phases:** 7 (4 v1.0 complete + 3 v1.1 planned)
**Requirements:** 40 mapped (24 v1.0 + 16 v1.1)

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Foundation | Typed API client with auth, rate limiting, and project scaffold | SETUP-01, SETUP-02, SETUP-03, API-01, API-02, API-03, API-04 | 7 |
| 2 | Core Commands | All 6 synchronous endpoint commands working end-to-end | CMD-01, CMD-02, CMD-03, CMD-04, CMD-05, CMD-06 | 6 |
| 3 | Async Workflows | Export people and email finder with auto-polling and progress | ASYNC-01, ASYNC-02, ASYNC-03, ASYNC-04 | 4 |
| 4 | I/O Pipeline | CSV/stdin input, multi-format output, Clay integration | INPUT-01, INPUT-02, INPUT-03, OUT-01, OUT-02, OUT-03, OUT-04 | 7 |
| 5 | Normalization Layer | Clean, flat response schema replacing raw API noise | NORM-01, NORM-02, NORM-03, NORM-04 | 3 |
| 6 | Persistence & Tiers | Auto-save every result + field tier filtering via --profile | PERSIST-01, PERSIST-02, PERSIST-03, PERSIST-04, TIER-01, TIER-02, TIER-03, TIER-04 | 5 |
| 7 | Pipeline Command | One-command search → export → find-emails with full output | PIPELINE-01, PIPELINE-02, PIPELINE-03, PIPELINE-04 | 4 |

---

## Phases

- [x] **Phase 1: Foundation** - Typed API client with auth, rate limiting, and CLI scaffold
- [x] **Phase 2: Core Commands** - All 6 sync endpoint commands working end-to-end
- [x] **Phase 3: Async Workflows** - Export people and email finder with auto-polling and progress
- [x] **Phase 4: I/O Pipeline** - CSV/stdin input, multi-format output, Clay integration
- [ ] **Phase 5: Normalization Layer** - Clean, flat response schema replacing raw API noise
- [ ] **Phase 6: Persistence & Tiers** - Auto-save every result + field tier filtering via --profile
- [ ] **Phase 7: Pipeline Command** - One-command search → export → find-emails with full output

---

## Phase Details

### Phase 1: Foundation
**Goal**: Bun + TypeScript project with typed API client, auth, rate limiting, and CLI scaffold.
**Depends on**: Nothing (greenfield)
**Requirements**: SETUP-01, SETUP-02, SETUP-03, API-01, API-02, API-03, API-04
**Success Criteria** (what must be TRUE):
  1. `bun run build` produces working CLI binary
  2. `ai-ark --help` displays all command groups with descriptions
  3. `ai-ark credits` returns credit balance from live API (proves auth + client work)
  4. Rate limiter correctly throttles when burst-tested (5/sec limit enforced)
  5. TypeScript compiler catches invalid API payload shapes at build time
**Plans**: 2 plans
- [x] 01-01-PLAN.md — Project scaffold + TypeScript types for all 14 API schemas
- [x] 01-02-PLAN.md — HTTP client with auth, rate limiter, error handling, and credits command
**UI hint**: no

### Phase 2: Core Commands
**Goal**: All 6 synchronous API endpoints exposed as CLI commands with filter flags.
**Depends on**: Phase 1
**Requirements**: CMD-01, CMD-02, CMD-03, CMD-04, CMD-05, CMD-06
**Success Criteria** (what must be TRUE):
  1. `ai-ark companies search --domain leadgrow.ai` returns company data as JSON
  2. `ai-ark people search --domain leadgrow.ai --seniority founder` returns matching profiles
  3. `ai-ark people lookup --email test@example.com` performs reverse lookup
  4. `ai-ark people phone --linkedin "https://linkedin.com/in/someone"` returns phone data
  5. `ai-ark people analyze --linkedin "https://linkedin.com/in/someone"` returns personality analysis
  6. All commands print valid JSON to stdout (pipeable)
**Plans**: 1 plan
- [x] 02-01 — All 5 sync commands (companies search, people search/lookup/phone/analyze)
**UI hint**: no

### Phase 3: Async Workflows
**Goal**: Export people and email finder commands with automatic polling, progress display, and result fetching.
**Depends on**: Phase 2
**Requirements**: ASYNC-01, ASYNC-02, ASYNC-03, ASYNC-04
**Success Criteria** (what must be TRUE):
  1. `ai-ark people export --domain example.com --seniority director` submits job, shows progress bar, returns results when done
  2. `ai-ark people find-emails --track-id <id>` triggers email finding, polls, returns verified emails
  3. Progress output shows: state, total records, found count, elapsed time (updates in place)
  4. `--no-wait` flag returns trackId immediately without polling
  5. Handles FAILED state gracefully with clear error message
**Plans**: 1 plan
- [x] 03-01 — Shared poller + export + find-emails commands with --no-wait
**UI hint**: no

### Phase 4: I/O Pipeline
**Goal**: CSV and stdin input, multi-format output (JSON, CSV, table, Clay push).
**Depends on**: Phase 2 + 3
**Requirements**: INPUT-01, INPUT-02, INPUT-03, OUT-01, OUT-02, OUT-03, OUT-04
**Success Criteria** (what must be TRUE):
  1. `ai-ark people search --input companies.csv --domain-col Website` reads CSV and searches each domain
  2. `echo '{"domain":"leadgrow.ai"}' | ai-ark people search` accepts piped JSON input
  3. `ai-ark credits --format table` prints formatted table to terminal
  4. `ai-ark people search --domain x.com --format csv` outputs valid CSV
  5. `ai-ark people search --domain x.com --clay-table TABLE_ID` pushes results to Clay
  6. Default output is JSON (backward compatible with piping)
**Plans**: 1 plan
- [x] 04-01 — I/O modules (formatters, CSV reader, stdin reader, Clay push) + wired into all commands
**UI hint**: no

---

## v1.1 Phases

### ~~Phase 5: Normalization Layer~~ — SKIPPED
Normalization handled in skill layer above the CLI. CLI stays dumb. NORM-01–04 moved to Out of Scope.

### Phase 5: Persistence & Tiers
**Goal**: Every result auto-saves to disk by default, and `--profile` controls exactly which fields survive.
**Depends on**: Phase 4
**Requirements**: PERSIST-01, PERSIST-02, PERSIST-03, PERSIST-04, TIER-01, TIER-02, TIER-03, TIER-04
**Success Criteria** (what must be TRUE):
  1. Running any data command with no extra flags creates a timestamped file in `~/.ai-ark/results/` — user never has to think about saving
  2. `--no-save` suppresses the auto-save and `--output path/to/file.json` writes to the specified location instead
  3. `--profile outbound` output contains only Tier 1 fields, normalized — no S3 URLs, no null-heavy arrays, no pagination metadata
  4. `--profile raw` output is byte-for-byte identical to what the API returned — existing pipe workflows are unaffected
  5. `docs/FIELD-TIERS.md` documents the tier assignment for every API response field
**Plans**: TBD
**UI hint**: no

### Phase 6: Pipeline Command
**Goal**: Users run one command to get a fully enriched, email-verified, persisted contact list — no manual trackId juggling.
**Depends on**: Phase 5 (persistence must be in place)
**Requirements**: PIPELINE-01, PIPELINE-02, PIPELINE-03, PIPELINE-04
**Success Criteria** (what must be TRUE):
  1. `ai-ark people pipeline --domain example.com --seniority vp` runs all three stages and produces a final JSON file with no manual steps between them
  2. All filter flags available on `people search` work identically on `people pipeline`
  3. Stderr shows stage-labeled progress: `[1/3] Searching...`, `[2/3] Exporting...`, `[3/3] Finding emails...` with record counts at each stage
  4. Pipeline output is Tier 1 filtered and auto-persisted to `~/.ai-ark/results/`
**Plans**: TBD
**UI hint**: no

---

## Requirement Coverage

### v1.0 (Complete)

All 24 v1 requirements mapped. 0 unmapped.

| Category | Count | Phase |
|----------|-------|-------|
| Setup | 3 | 1 |
| API Client | 4 | 1 |
| Core Commands | 6 | 2 |
| Async Workflows | 4 | 3 |
| Input Handling | 3 | 4 |
| Output Handling | 4 | 4 |

### v1.1 (Planned)

All 16 v1.1 requirements mapped. 0 unmapped.

| Category | Count | Phase |
|----------|-------|-------|
| Normalization (NORM) | 4 | 5 |
| Persistence (PERSIST) | 4 | 6 |
| Field Tiers (TIER) | 4 | 6 |
| Pipeline (PIPELINE) | 4 | 7 |

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-04-01 |
| 2. Core Commands | 1/1 | Complete | 2026-04-10 |
| 3. Async Workflows | 1/1 | Complete | 2026-04-17 |
| 4. I/O Pipeline | 1/1 | Complete | 2026-04-29 |
| 5. Normalization Layer | 0/TBD | Not started | - |
| 6. Persistence & Tiers | 0/TBD | Not started | - |
| 7. Pipeline Command | 0/TBD | Not started | - |

---
*Roadmap created: 2026-03-31*
*Last updated: 2026-04-29 — v1.1 phases 5-7 added (NORM, PERSIST+TIER, PIPELINE)*
