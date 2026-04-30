---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Phases
status: verifying
last_updated: "2026-04-30T02:03:22.725Z"
last_activity: 2026-04-30
progress:
  total_phases: 6
  completed_phases: 3
  total_plans: 5
  completed_plans: 5
---

# Project State: AI Ark CLI — v1.1

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-29)

**Core value:** Reliable, typed access to every AI Ark API endpoint from the command line with automatic async job management.

## Current Position

Phase: 06 (pipeline-command) — EXECUTING
Plan: 1 of 1
Status: Phase complete — ready for verification
Last activity: 2026-04-30
Last session: 2026-04-30T02:03:22.722Z

## v1.1 Phase Summary

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 5 | Persistence & Tiers | PERSIST-01–04, TIER-01–04 | In progress (1/2 plans done) |
| 6 | Pipeline Command | PIPELINE-01–04 | Not started |

## Decisions Made

- **05-01**: Explicit `--output` path wins even when `--no-save` is also passed — honor user intent
- **05-01**: `--no-wait` async branches persist `{trackId, state}` — recoverable data worth saving
- **05-01**: Batch paths persist `allResults` once at end, not per-domain — one file per invocation
- [Phase 05]: Default profile is outbound — behavior change for existing pipe workflows (--profile raw to restore API shape)
- [Phase 05]: filterByProfile runs BEFORE persistResults — saved files always match stdout shape
- [Phase 06]: exportTrackId (not search trackId) passed to email-finder — export job produces the inquiry records that email-finder enriches
- [Phase 06]: No --no-wait or --page on pipeline — always waits, single-pass internal pagination

## Accumulated Context

### From v1.0

- All 14 endpoints wrapped, typed, and working
- Async polling pattern established (poller.ts — polls every 3s, progress to stderr, data to stdout)
- Rate limiter enforced client-side (5/sec, 300/min, 18K/hr)
- Output pipeline: formatOutput() routes json/csv/table to stdout; pushToClay() handles Clay integration
- search → export → find-emails requires 3 separate commands with manual trackId passing
- Zero data persistence by default — all results go to stdout only
- S3 signed image URLs in responses expire in 24h — ephemeral, should never be persisted as "data"
- Clay temp CSV is written to os.tmpdir() then deleted — no persistence there either

### v1.1 Architecture Decisions

- Normalization layer: `src/io/normalize.ts` — transforms raw API response to clean flat shape
- Field tier filtering: `src/io/filter.ts` — strips non-Tier-1 fields based on `--profile` flag
- `--profile raw` MUST preserve existing behavior exactly — no breaking changes to current pipe workflows
- Auto-persist saves BEFORE formatOutput to stdout — file always written even if user pipes output elsewhere
- `people pipeline` command: `src/commands/people-pipeline.ts` — chains search → export → find-emails
- `--profile` flag wired into ALL data commands: people search, people export, people find-emails, people lookup, people phone, companies search, people export-one
- Build order: Phase 5 (NORM) → Phase 6 (PERSIST+TIER) → Phase 7 (PIPELINE)

### v1.1 Goals

- Auto-persist: save every result to `~/.ai-ark/results/` automatically
- Field tiers: classify which fields are GTM gold vs. noise
- Pipeline command: chain search → export → find-emails in one invocation

---
*v1.1 started: 2026-04-29*
*v1.1 roadmap created: 2026-04-29 — 3 phases defined*
