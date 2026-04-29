---
phase: 05-persistence-tiers
plan: "01"
subsystem: io
tags: [persistence, auto-save, flags, output]
dependency_graph:
  requires: []
  provides: [persistResults, PersistOptions, buildDefaultPath, --no-save, --output]
  affects: [people-search, people-export, people-find-emails, people-lookup, people-phone, people-export-one, companies-search]
tech_stack:
  added: [src/io/persist.ts]
  patterns: [auto-persist before formatOutput, stderr-only save log, explicit path overrides noSave]
key_files:
  created:
    - src/io/persist.ts
  modified:
    - src/io/index.ts
    - src/commands/people-search.ts
    - src/commands/people-export.ts
    - src/commands/people-find-emails.ts
    - src/commands/people-lookup.ts
    - src/commands/people-phone.ts
    - src/commands/people-export-one.ts
    - src/commands/companies-search.ts
decisions:
  - "Explicit --output wins even when --no-save is also passed — user gave a path, honor it"
  - "--no-wait async branches persist {trackId, state} — still recoverable data worth saving"
  - "Batch paths persist allResults once at end, not per-domain — one file per command invocation"
  - "people-phone and people-search use format-aware dataToOutput variable to match what formatOutput receives"
metrics:
  duration: "3 minutes"
  completed: "2026-04-29"
  tasks_completed: 2
  files_changed: 9
---

# Phase 05 Plan 01: Auto-Persistence Module Summary

Auto-save every API result to `~/.ai-ark/results/YYYY-MM-DD_HH-MM_<command>.json` with zero config. Users no longer lose data when a pipe closes.

## What Was Built

### New Module: `src/io/persist.ts`

Three exports:

- `PersistOptions` — interface: `{ data, command, output?, noSave? }`
- `buildDefaultPath(command, now?)` — builds the timestamped default path under `~/.ai-ark/results/`; exported for testability
- `persistResults(opts)` — writes to disk, logs `Saved: <path>` to stderr, returns absolute path or null

Resolution order (explicit wins over default, default wins over skip):
1. `opts.output` provided → write to that exact path (even if `noSave=true`)
2. `opts.noSave=true` and no `output` → write nothing, return null
3. Default → `~/.ai-ark/results/YYYY-MM-DD_HH-MM_<command>.json`

Directory created automatically via `mkdirSync(dir, { recursive: true })` — no manual mkdir required.

### Wiring Pattern (7 commands)

**Sync commands** (people-search, people-lookup, people-phone, people-export-one, companies-search):

```typescript
const dataToOutput = format === "json" ? result : result.content;
persistResults({ data: dataToOutput, command: "people-search", output: opts.output, noSave: opts.save === false });
if (opts.clayTable) pushToClay(opts.clayTable, result.content);
formatOutput(dataToOutput, format);
```

**Async commands** (people-export, people-find-emails) — after `pollUntilDone` + pagination loop:

```typescript
persistResults({ data: allResults, command: "people-export", output: opts.output, noSave: opts.save === false });
if (opts.clayTable) pushToClay(opts.clayTable, allResults);
formatOutput(allResults, format);
```

**`--no-wait` branch** (async commands only) — persist `{trackId, state}` before returning:

```typescript
const noWaitData = { trackId: job.trackId, state: job.state };
persistResults({ data: noWaitData, command: "people-export", output: opts.output, noSave: opts.save === false });
formatOutput(noWaitData, format);
```

**`--dry-run` branch** — no persist (preview payload, not real data).

### Stderr Convention

Every saved file logs exactly one line to stderr:
```
Saved: /Users/mitch/.ai-ark/results/2026-04-29_16-53_people-search.json
```

Never stdout. JSON/CSV pipes remain uncontaminated.

### Commander.js Flag Mechanics

`--no-save` maps to `opts.save = false` via Commander's boolean negation pattern. When absent, `opts.save` is `true`. The check is always `opts.save === false`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All 7 commands are fully wired with real write behavior.

## Self-Check: PASSED

- `src/io/persist.ts` exists: FOUND
- `src/io/index.ts` exports persist symbols: FOUND
- All 7 command files import and call persistResults: FOUND (7/7 grep hits)
- Commits exist:
  - a3d1bf2 (Task 1 — persist module)
  - 6aeb490 (Task 2 — wire into 7 commands)
- Live test: `people search --domain leadgrow.ai --size 1` → file created in `~/.ai-ark/results/`, stderr shows `Saved:`
- `--no-save` → no file created, no `Saved:` in stderr
- `--output ./out.json` → file at explicit path
