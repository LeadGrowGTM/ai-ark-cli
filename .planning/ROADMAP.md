# Roadmap: AI Ark CLI

**Created:** 2026-03-31
**Phases:** 4
**Requirements:** 24 mapped

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Foundation | Typed API client with auth, rate limiting, and project scaffold | SETUP-01, SETUP-02, SETUP-03, API-01, API-02, API-03, API-04 | 7 |
| 2 | Core Commands | All 6 synchronous endpoint commands working end-to-end | CMD-01, CMD-02, CMD-03, CMD-04, CMD-05, CMD-06 | 6 |
| 3 | Async Workflows | Export people and email finder with auto-polling and progress | ASYNC-01, ASYNC-02, ASYNC-03, ASYNC-04 | 4 |
| 4 | I/O Pipeline | CSV/stdin input, multi-format output, Clay integration | INPUT-01, INPUT-02, INPUT-03, OUT-01, OUT-02, OUT-03, OUT-04 | 7 |

---

## Phase 1: Foundation

**Goal:** Bun + TypeScript project with typed API client, auth, rate limiting, and CLI scaffold.

**Requirements:** SETUP-01, SETUP-02, SETUP-03, API-01, API-02, API-03, API-04

**UI hint**: no

**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold + TypeScript types for all 14 API schemas
- [x] 01-02-PLAN.md — HTTP client with auth, rate limiter, error handling, and credits command

**Success Criteria:**
1. `bun run build` produces working CLI binary
2. `ai-ark --help` displays all command groups with descriptions
3. `ai-ark credits` returns credit balance from live API (proves auth + client work)
4. Rate limiter correctly throttles when burst-tested (5/sec limit enforced)
5. TypeScript compiler catches invalid API payload shapes at build time

**Dependencies:** None (greenfield)

**Estimated complexity:** Medium

---

## Phase 2: Core Commands

**Goal:** All 6 synchronous API endpoints exposed as CLI commands with filter flags.

**Requirements:** CMD-01, CMD-02, CMD-03, CMD-04, CMD-05, CMD-06

**UI hint**: no

Plans:
- [x] 02-01 — All 5 sync commands (companies search, people search/lookup/phone/analyze)

**Success Criteria:**
1. `ai-ark companies search --domain leadgrow.ai` returns company data as JSON
2. `ai-ark people search --domain leadgrow.ai --seniority founder` returns matching profiles
3. `ai-ark people lookup --email test@example.com` performs reverse lookup
4. `ai-ark people phone --linkedin "https://linkedin.com/in/someone"` returns phone data
5. `ai-ark people analyze --linkedin "https://linkedin.com/in/someone"` returns personality analysis
6. All commands print valid JSON to stdout (pipeable)

**Dependencies:** Phase 1 (API client, types, CLI scaffold)

**Estimated complexity:** Medium

---

## Phase 3: Async Workflows

**Goal:** Export people and email finder commands with automatic polling, progress display, and result fetching.

**Requirements:** ASYNC-01, ASYNC-02, ASYNC-03, ASYNC-04

**UI hint**: no

**Success Criteria:**
1. `ai-ark people export --domain example.com --seniority director` submits job, shows progress bar, returns results when done
2. `ai-ark people find-emails --track-id <id>` triggers email finding, polls, returns verified emails
3. Progress output shows: state, total records, found count, elapsed time (updates in place)
4. `--no-wait` flag returns trackId immediately without polling
5. Handles FAILED state gracefully with clear error message

**Dependencies:** Phase 2 (command structure, API types)

**Estimated complexity:** Medium-High (polling state machine, progress display)

---

## Phase 4: I/O Pipeline

**Goal:** CSV and stdin input, multi-format output (JSON, CSV, table, Clay push).

**Requirements:** INPUT-01, INPUT-02, INPUT-03, OUT-01, OUT-02, OUT-03, OUT-04

**UI hint**: no

**Success Criteria:**
1. `ai-ark people search --input companies.csv --domain-col Website` reads CSV and searches each domain
2. `echo '{"domain":"leadgrow.ai"}' | ai-ark people search` accepts piped JSON input
3. `ai-ark credits --format table` prints formatted table to terminal
4. `ai-ark people search --domain x.com --format csv` outputs valid CSV
5. `ai-ark people search --domain x.com --clay-table TABLE_ID` pushes results to Clay
6. Default output is JSON (backward compatible with piping)

**Dependencies:** Phase 2 + 3 (all commands must exist before I/O wrapping)

**Estimated complexity:** Medium

---

## Requirement Coverage

All 24 v1 requirements mapped. 0 unmapped.

| Category | Count | Phase |
|----------|-------|-------|
| Setup | 3 | 1 |
| API Client | 4 | 1 |
| Core Commands | 6 | 2 |
| Async Workflows | 4 | 3 |
| Input Handling | 3 | 4 |
| Output Handling | 4 | 4 |

---
*Roadmap created: 2026-03-31*
*Last updated: 2026-03-31 after Phase 2 completion*
