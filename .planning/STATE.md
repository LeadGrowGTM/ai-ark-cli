---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Data Preservation & Export Pipeline
status: Planning
last_updated: "2026-04-29T00:00:00.000Z"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State: AI Ark CLI — v1.1

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-29)

**Core value:** Reliable, typed access to every AI Ark API endpoint from the command line with automatic async job management.

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-29 — Milestone v1.1 started

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

### v1.1 Goals

- Auto-persist: save every result to `~/.ai-ark/results/` automatically
- Field tiers: classify which fields are GTM gold vs. noise
- Pipeline command: chain search → export → find-emails in one invocation

---
*v1.1 started: 2026-04-29*
