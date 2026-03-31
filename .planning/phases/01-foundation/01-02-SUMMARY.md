---
phase: 01-foundation
plan: 02
subsystem: api-client
tags: [bun, typescript, http-client, rate-limiter, commander, auth]

requires:
  - 01-01

provides:
  - Typed HTTP client (AiArkClient) with X-TOKEN auth and structured error handling
  - Multi-tier token bucket rate limiter (5/sec, 300/min, 18K/hr)
  - createClient() factory with actionable missing-key error
  - Working `ai-ark credits` command hitting live API
  - Finalized CLI help text with all command group descriptions
affects: [03, 04, 05]

tech-stack:
  added: []
  patterns:
    - Token bucket rate limiter with multiple tiers sharing a single acquire() gate
    - Factory function (createClient) reads env var and throws actionable error if missing
    - Structured error class (AiArkApiError) surfaces API error fields (status, error, path, timestamp)
    - Per-command error handling instead of startup guard — commands own their own error messages

key-files:
  created:
    - src/client/rate-limiter.ts
    - src/client/http.ts
    - src/client/index.ts
    - src/commands/credits.ts
  modified:
    - src/index.ts

key-decisions:
  - "Removed startup API key guard from index.ts — moved to per-command via createClient() so each command surfaces its own errors cleanly"
  - "AiArkApiError structured with status + apiError + path + timestamp matching the ApiError type from Plan 01"
  - "Rate limiter refills on each acquire() call (not on a background timer) — simpler, no memory leaks, correct behavior"

metrics:
  duration: 10min
  tasks: 2
  files_created: 4
  files_modified: 1
  completed: 2026-03-31T19:35:00Z
---

# Phase 1 Plan 02: HTTP Client + Auth + Credits Command Summary

**Typed HTTP client with X-TOKEN auth, 3-tier rate limiter (5/sec/300/min/18K/hr), structured API error handling, and working `ai-ark credits` command against live API**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-31T19:23:57Z
- **Completed:** 2026-03-31T19:35:00Z
- **Tasks:** 2
- **Files created:** 4, modified: 1

## Accomplishments

- `AiArkClient` handles all GET/POST requests with X-TOKEN auth — rate limiter gates every request before it goes out
- `RateLimiter` is a 3-tier token bucket: 5/sec, 300/min, 18K/hr tiers all check before each acquire; waits on the emptiest tier if throttled
- `AiArkApiError` surfaces `status`, `apiError`, `path`, and `timestamp` from API 4xx/5xx responses — matches the `ApiError` shape from Plan 01 types
- `createClient()` reads `AI_ARK_API_KEY` and throws an actionable error with the API management URL if missing
- `ai-ark credits` hits `GET /payments/credits` and outputs JSON — error path confirmed: missing key prints clear message to stderr, exits 1
- CLI `--help` displays all command groups with accurate descriptions; `people --help` shows all 6 subcommands

## Task Commits

1. **Task 1: Build HTTP client with auth, rate limiter, and error handling** — `823a6f2` (feat)
2. **Task 2: Wire credits command and finalize CLI help text** — `4c89fab` (feat)

## Files Created/Modified

- `src/client/rate-limiter.ts` — Multi-tier token bucket rate limiter, RateLimiter class
- `src/client/http.ts` — AiArkClient, AiArkApiError, createClient factory
- `src/client/index.ts` — Barrel export for all client exports
- `src/commands/credits.ts` — creditsCommand() using createClient() + GET /payments/credits
- `src/index.ts` — Removed startup key guard, added creditsCommand(), updated descriptions, added uncaughtException handler

## Decisions Made

- **Removed startup API key guard** from `src/index.ts` — the original Plan 01 scaffold had an early-exit guard that prevented any command from running without a key. Moved to per-command handling so each command owns its own error path. This is cleaner for `--help` access and future commands that might not need auth.
- **Rate limiter refills on acquire()** rather than a background timer — simpler, no async setup, correct behavior under Node/Bun's event loop. Calculates elapsed time since lastRefill on every call.
- **AiArkApiError** matches the `ApiError` type defined in Plan 01 exactly — `status`, `error` (as `apiError`), `path`, `timestamp` all preserved in the error class.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed startup API key guard**
- **Found during:** Task 2
- **Issue:** `src/index.ts` from Plan 01 had a startup guard (`if (!process.env.AI_ARK_API_KEY) { process.exit(1) }`) that would prevent `credits` from ever reaching its own error handler. The plan's acceptance criteria required the error to come from the command itself.
- **Fix:** Removed the startup guard from `src/index.ts`; error handling now lives in `creditsCommand()` via the `createClient()` try/catch.
- **Files modified:** `src/index.ts`
- **Commit:** `4c89fab`

## Known Stubs

None. `ai-ark credits` hits the live API with real credentials. All other commands (`companies search`, `people *`) remain as "Not implemented yet" placeholders — these are intentional pending Phase 2 implementation, not stubs that block this plan's goal.

## Self-Check: PASSED

- `src/client/rate-limiter.ts` — exists, contains RateLimiter class
- `src/client/http.ts` — exists, contains AiArkClient, AiArkApiError, createClient
- `src/client/index.ts` — exists, barrel exports all client symbols
- `src/commands/credits.ts` — exists, exports creditsCommand
- Commits `823a6f2` and `4c89fab` verified in git log
- `bun run build` succeeds (13 modules bundled)
- `bun dist/index.js --help` shows credits, companies, people
- Missing key error path confirmed working
