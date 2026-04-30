---
phase: 06-pipeline-command
plan: "01"
subsystem: commands
tags: [pipeline, search, export, email-finder, async, tier-filter, persistence]
dependency_graph:
  requires: [05-01, 05-02]
  provides: [people-pipeline-command]
  affects: [src/index.ts]
tech_stack:
  added: []
  patterns: [chained-async-polling, stage-banner-progress, reuse-filter-flags]
key_files:
  created:
    - src/commands/people-pipeline.ts
  modified:
    - src/index.ts
decisions:
  - "exportTrackId (not search trackId) is passed to email-finder — export job produces the inquiry records that email-finder enriches"
  - "Stage 1 trackId is informational only; stage 3 uses the export job's trackId throughout"
  - "No --page flag on pipeline — single-pass export, internal pagination handles result fetch"
  - "No --no-wait flag — pipeline always waits; async stages are internal implementation details"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-30"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
---

# Phase 06 Plan 01: Pipeline Command Summary

**One-liner:** people pipeline command chains search → export → find-emails in one invocation using exportTrackId as the handoff between stages 2 and 3.

## What Was Built

`src/commands/people-pipeline.ts` — 196-line command that eliminates the manual trackId juggling that was the primary v1.0 friction point. Users run a single command with standard filter flags and get a Tier 1 filtered, persisted JSON file with verified emails.

### Stage Flow

```
[1/3] Searching...     → POST /people              → captures trackId (informational)
[2/3] Exporting...     → POST /people/export        → poll until DONE → exportTrackId
[3/3] Finding emails...→ POST /people/email-finder  → poll until DONE → paginate results
                                                     → filterByProfile → persistResults → stdout
```

### Key Design Decision: trackId Handoff

The search response (`PaginatedPeopleResponse`) includes a `trackId`, but stage 3 (email-finder) uses `exportTrackId` — the trackId from the export job. This is because:
- The export job generates the inquiry records
- Email-finder enriches those inquiry records
- Search trackId is informational only (shown in stage 1 banner)

### Filter Flags

All filter flags from `people-search.ts` are replicated verbatim — 28 options covering account filters, contact filters, exclude filters, match-mode, and output controls. Omitted from pipeline:
- `--page` — pipeline uses single-pass internal pagination
- `--input`, `--domain-col`, `--linkedin` — pipeline is filter-flag only, not batch CSV
- `--no-wait` — pipeline always waits; async is internal

## Deviations from Plan

None — plan executed exactly as written.

## Acceptance Criteria Verification

- `src/commands/people-pipeline.ts` exists: YES (196 lines)
- Exports `peoplePipelineCommand`: YES
- Imports `pollUntilDone`, `filterByProfile`, `persistResults`, `buildAccountFilter`: YES
- Stage banners `[1/3]`, `[2/3]`, `[3/3]` present as literal strings: YES
- Hits `/people/export` and `/people/email-finder` endpoints: YES
- Persists with `command: "people-pipeline"`: YES
- Filter flags `--seniority`, `--domain`, `--exclude-domain`, `--profile` present: YES
- `bun run src/index.ts people pipeline --help` exits 0: YES — shows all flags
- Dry-run exits 0 and stderr contains "Dry run": YES

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 0939030 | feat(06-01): implement peoplePipelineCommand chaining all 3 stages |
| 2 | 648af21 | feat(06-01): register peoplePipelineCommand in src/index.ts |

## Known Stubs

None.

## Self-Check: PASSED
