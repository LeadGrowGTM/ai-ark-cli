---
phase: 05-persistence-tiers
verified: 2026-04-29T17:10:00Z
status: passed
score: 13/13 must-haves verified
gaps: []
human_verification:
  - test: "Run people search with no extra flags against real API and confirm timestamped file appears in ~/.ai-ark/results/ with today's date and outbound-shaped JSON"
    expected: "File created, stderr shows 'Saved: <path>', stdout is flat first_name/current_company shape (not nested profile.first_name)"
    why_human: "Requires a live API key — automated unit tests use mock data"
  - test: "Run people search --profile raw and confirm output contains expiring S3 URL pattern (exp: or X-Amz-Expires)"
    expected: "Raw profile contains profile.picture.source with a CDN-signed URL; outbound default does not"
    why_human: "Requires live API response to confirm actual S3 field presence in raw mode"
  - test: "Pipe people search to file (> out.json) and confirm BOTH the pipe target AND ~/.ai-ark/results/ file are created"
    expected: "Two files exist: the pipe target AND the auto-save copy in ~/.ai-ark/results/"
    why_human: "Confirms the 'persist before formatOutput' ordering guarantee under real pipe conditions"
---

# Phase 05: Persistence & Tiers Verification Report

**Phase Goal:** Every result auto-saves to disk by default, and `--profile` controls exactly which fields survive.
**Verified:** 2026-04-29T17:10:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Running any data command with no extra flags creates a timestamped file in `~/.ai-ark/results/` | VERIFIED | `buildDefaultPath` unit test passes; `persistResults` wrote `~/.ai-ark/results/2026-04-29_17-07_unit-test.json` in live run; all 7 commands call `persistResults` before `formatOutput` |
| 2  | `--no-save` suppresses auto-save | VERIFIED | `persistResults({ noSave: true })` returns null (confirmed by inline test); `--no-save` option present in all 7 commands; maps to `opts.save === false` per Commander boolean negation |
| 3  | `--output <file>` writes to explicit path instead of default location | VERIFIED | `persistResults({ output: '/tmp/x.json', noSave: true })` wrote to explicit path and returned that path; explicit output wins over noSave |
| 4  | `~/.ai-ark/results/` auto-created on first save — no manual mkdir required | VERIFIED | `mkdirSync(dirname(target), { recursive: true })` in `persist.ts` line 52; directory created during unit test run |
| 5  | Persistence path is logged to stderr, never stdout | VERIFIED | `process.stderr.write('Saved: ...')` at `persist.ts` line 54 — uses stderr writer not console.log |
| 6  | `--profile outbound` (default) returns only Tier 1 fields — no S3 URLs, no null-heavy arrays | VERIFIED | All 20 tier-filter test cases pass; `profile.picture` key not present in outbound output; `filterPerson` strips nested `profile` object entirely |
| 7  | `--profile raw` returns byte-for-byte API response — existing pipe workflows unaffected | VERIFIED | Tier-filter test confirms `JSON.stringify(raw) === JSON.stringify(samplePerson)` — reference passthrough |
| 8  | Auto-persisted files contain the same filtered shape as stdout | VERIFIED | `filterByProfile` runs BEFORE `persistResults` in every command's action handler — same `filtered` variable passed to both |
| 9  | Default profile is `outbound` — running with no `--profile` flag returns Tier 1 fields | VERIFIED | All 7 `.option("--profile <name>", ..., "outbound")` calls set default to `"outbound"` |
| 10 | Person and Company filter functions are pure — same input always produces same output, no I/O | VERIFIED | `filterPerson` and `filterCompany` are private pure functions; no imports of fs, network, or side-effecting APIs |
| 11 | `--no-wait` async branches still persist `{trackId, state}` | VERIFIED | Both `people-export.ts` line 114 and `people-find-emails.ts` line 49 call `persistResults` before `formatOutput` in the `!opts.wait` branch |
| 12 | `--dry-run` branches do NOT persist | VERIFIED | `people-search.ts` dry-run branch hits `return` at line 123 before either `persistResults` call; same pattern confirmed in `people-export.ts` |
| 13 | `docs/FIELD-TIERS.md` has tier assignment for every API response field | VERIFIED | AWK check `ALL ROWS HAVE TIERS` passed; `## Tier Definitions` section present; `finalized 2026-04-29` footer confirmed |

**Score:** 13/13 truths verified

---

### Required Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `src/io/persist.ts` | `persistResults`, `buildDefaultPath`, `PersistOptions` | VERIFIED | 57 lines, substantive implementation; exports confirmed |
| `src/io/tier-filter.ts` | `filterByProfile`, `PERSON_TIER1_FIELDS`, `COMPANY_TIER1_FIELDS`, `Profile`, `EntityKind` | VERIFIED | 152 lines; pure functions; all 5 exports present |
| `src/io/index.ts` | Barrel re-exports both modules | VERIFIED | Lines 10-13 re-export `persistResults`, `buildDefaultPath`, `PersistOptions`, `filterByProfile`, `PERSON_TIER1_FIELDS`, `COMPANY_TIER1_FIELDS`, `Profile`, `EntityKind` |
| `docs/FIELD-TIERS.md` | Tier 1/2/3 assignments for every Person + Company field | VERIFIED | Every table row has a tier value; Tier Definitions section; finalized footer |
| `src/commands/people-search.ts` | `--no-save`, `--output`, `--profile` flags + wiring | VERIFIED | All 3 flags present; `filterByProfile` before `persistResults` before `formatOutput` |
| `src/commands/people-export.ts` | Same flags + async wiring after pagination loop | VERIFIED | Flags present; filter → persist → output after `while(true)` loop completes |
| `src/commands/people-find-emails.ts` | Same flags + async wiring | VERIFIED | Flags present; filter → persist → output after pagination loop |
| `src/commands/people-lookup.ts` | Same flags + sync wiring | VERIFIED | Flags present; `filterByProfile(result, "person", profile)` → `persistResults` → `formatOutput` |
| `src/commands/people-phone.ts` | Same flags + sync wiring | VERIFIED | Flags present; filter applied to format-aware `rawData` |
| `src/commands/people-export-one.ts` | Same flags + sync wiring | VERIFIED | Flags present; single result filtered before persist |
| `src/commands/companies-search.ts` | Same flags with `kind='company'` | VERIFIED | `filterByProfile(..., "company", profile)` confirmed on both batch and single paths |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `people-search.ts` | `persist.ts` | `persistResults(` call | VERIFIED | 2 calls (batch + single path) at lines 150, 181 |
| `people-export.ts` | `persist.ts` | `persistResults(` call | VERIFIED | 2 calls (no-wait + post-pagination) at lines 114, 151 |
| `people-find-emails.ts` | `persist.ts` | `persistResults(` call | VERIFIED | 2 calls (no-wait + post-pagination) at lines 49, 86 |
| `people-lookup.ts` | `persist.ts` | `persistResults(` call | VERIFIED | 1 call at line 46 |
| `people-phone.ts` | `persist.ts` | `persistResults(` call | VERIFIED | 1 call at line 64 |
| `people-export-one.ts` | `persist.ts` | `persistResults(` call | VERIFIED | 1 call at line 49 |
| `companies-search.ts` | `persist.ts` | `persistResults(` call | VERIFIED | 2 calls (batch + single path) |
| `people-search.ts` | `tier-filter.ts` | `filterByProfile(` call | VERIFIED | 2 calls; `filtered` passed to `persistResults` before `formatOutput` |
| `companies-search.ts` | `tier-filter.ts` | `filterByProfile(..., "company", ...)` | VERIFIED | `kind='company'` confirmed on both code paths |
| `people-export.ts` | `tier-filter.ts` | `filterByProfile(allResults, "person", profile)` | VERIFIED | After pagination loop before persist |
| `people-find-emails.ts` | `tier-filter.ts` | `filterByProfile(allResults, "person", profile)` | VERIFIED | After pagination loop before persist |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `persist.ts` | `opts.data` | Caller-provided (already fetched from API) | Yes — receives post-API-call data | FLOWING |
| `tier-filter.ts` | input `data` | Caller-provided API response object | Yes — pure transform, no stubbed outputs | FLOWING |
| `people-search.ts` | `filtered` | `filterByProfile(rawData, "person", profile)` where `rawData` is from `client.post<PeopleSearchResponse>("/people", body)` | Yes — live HTTP fetch | FLOWING |
| `companies-search.ts` | `filtered` | `filterByProfile(rawData, "company", profile)` where `rawData` is from `client.post<CompanySearchResponse>("/companies", body)` | Yes — live HTTP fetch | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command / Test | Result | Status |
|----------|----------------|--------|--------|
| `buildDefaultPath` formats path correctly | `bun -e "buildDefaultPath('test-cmd', new Date('2026-04-29T14:30:00'))"` | `C:\Users\mitch\.ai-ark\results\2026-04-29_14-30_test-cmd.json` | PASS |
| `persistResults` writes file and returns path | Inline test with `command: 'unit-test'` | File created at `~/.ai-ark/results/2026-04-29_17-07_unit-test.json` | PASS |
| `persistResults` with `noSave: true` returns null | Inline test | Returns `null`, no file written | PASS |
| Explicit `--output` wins over `--no-save` | Inline test with `output: '/tmp/x.json', noSave: true` | File written to explicit path; `Saved:` logged to stderr | PASS |
| Tier filter: raw passthrough is byte-equal | `JSON.stringify(raw) === JSON.stringify(samplePerson)` | Equal | PASS |
| Tier filter: outbound strips `profile.picture` | Check `'picture' in ob` | False — S3 key not present | PASS |
| Tier filter: outbound maps `current_company` | Check `ob.current_company === 'Voda'` | Pass | PASS |
| Tier filter: array input returns same-length array | `filterByProfile([p, p], 'person', 'outbound')` | Length 2, first_name correct | PASS |
| Tier filter: null-safe on empty object | `filterByProfile({}, 'person', 'outbound')` | No throw, fields are undefined | PASS |
| Tier filter: company revenue_range mapped | `co.revenue_range === '1M-5M'` | Pass | PASS |
| Full test suite (`tier-filter.test.ts`) | `bun src/io/tier-filter.test.ts` | 20 passed, 0 failed | PASS |
| FIELD-TIERS.md completeness | AWK check for empty Tier cells | `ALL ROWS HAVE TIERS` | PASS |
| Help output shows all 3 new flags | `bun run src/index.ts people search --help` | `--profile`, `--output`, `--no-save` all visible | PASS |
| Help output on all 6 remaining commands | `... companies search`, `people lookup`, `people phone`, `people export`, `people find-emails`, `people export-one --help` | All 3 flags visible on all 6 commands | PASS |
| Live API-required tests | See Human Verification section | N/A — no API key in verification context | SKIP |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PERSIST-01 | 05-01 | Auto-save to `~/.ai-ark/results/` on every data command | SATISFIED | All 7 commands call `persistResults` before `formatOutput`; directory auto-created |
| PERSIST-02 | 05-01 | `--no-save` suppresses auto-save | SATISFIED | Flag in all 7 commands; `noSave: opts.save === false` passed to `persistResults` |
| PERSIST-03 | 05-01 | `--output <file>` writes to explicit path | SATISFIED | Flag in all 7 commands; `output: opts.output` passed to `persistResults`; explicit path wins over noSave |
| PERSIST-04 | 05-01 | `~/.ai-ark/results/` auto-created on first save | SATISFIED | `mkdirSync(dirname(target), { recursive: true })` in `persist.ts` |
| TIER-01 | 05-02 | Default output strips non-Tier-1 fields | SATISFIED | Default `--profile "outbound"` set on all 7 commands; `filterByProfile` applied before persist and output |
| TIER-02 | 05-02 | `--profile raw` bypasses all filtering | SATISFIED | `if (profile === 'raw') return data;` — reference passthrough; byte-equal confirmed by test |
| TIER-03 | 05-02 | `--profile outbound` returns Tier 1 fields, normalized | SATISFIED | `filterPerson` and `filterCompany` produce flat GTM-optimized shape; 20 passing tests confirm shape |
| TIER-04 | 05-02 | `docs/FIELD-TIERS.md` finalized with all tier assignments | SATISFIED | Every row has Tier 1/2/3; Tier Definitions section present; finalized footer |

**Note on REQUIREMENTS.md traceability:** The traceability table in `REQUIREMENTS.md` maps PERSIST/TIER IDs to "Phase 6" while the plan directory is `05-persistence-tiers`. ROADMAP.md correctly identifies this as Phase 5. The mismatch is a doc tracking artifact from when NORM requirements were dropped and phase numbers shifted — it does not affect code correctness.

---

### Anti-Patterns Found

| File | Pattern | Severity | Assessment |
|------|---------|----------|------------|
| None | — | — | No TODO/placeholder comments, no empty return {}/[], no stub handlers found in any of the 9 files modified in this phase |

Specific checks performed:
- `people-phone.ts`: `filterByProfile(rawData, "person", profile)` where `rawData = format === "json" ? result : result.phones` — this correctly passes the phone-specific result object through the filter. The `filterPerson` function is null-safe on missing keys so this will not crash if the response shape differs from a full person profile. This is expected behavior for a phone-specific endpoint, not a stub.
- `--no-wait` branches persist `{trackId, state}` — this is intentional per plan spec, not a stub.

---

### Human Verification Required

#### 1. Auto-save to disk on real API call

**Test:** `bun run src/index.ts people search --domain leadgrow.ai --size 1 --no-review-url`
**Expected:** Stderr shows `Saved: C:\Users\mitch\.ai-ark\results\YYYY-MM-DD_HH-MM_people-search.json`; that file exists; its contents are flat JSON with `first_name`, `current_company`, etc. (not nested `profile.first_name`).
**Why human:** Requires live API key. Inline tests use mock data; they cannot confirm the real API response round-trips correctly through the filter.

#### 2. Raw profile contains actual S3 URLs

**Test:** `bun run src/index.ts people search --domain leadgrow.ai --size 1 --profile raw --no-review-url --no-save | jq '.content[0].profile.picture'`
**Expected:** Returns a CDN URL with an expiry token (pattern `exp:` or `X-Amz`); confirms Tier 3 fields exist in raw output and are stripped in outbound default.
**Why human:** Requires a real API response — the specific S3 URL format can only be confirmed from live data (the SUMMARY notes the format changed from `X-Amz-Expires` to `exp:` pattern).

#### 3. Pipe + auto-save co-existence

**Test:** `bun run src/index.ts people search --domain leadgrow.ai --size 1 --no-review-url > /tmp/piped.json`
**Expected:** `/tmp/piped.json` exists AND `~/.ai-ark/results/*_people-search.json` exists. Both files have the same content.
**Why human:** Confirms the ordering guarantee (`persistResults` before `formatOutput`) works correctly in a real pipe scenario, not just unit test.

---

### Gaps Summary

No gaps. All automated checks passed. The three human verification items are confirmations against live API behavior — they do not represent unknown code paths, only live-data smoke tests that cannot be run without an API key.

---

_Verified: 2026-04-29T17:10:00Z_
_Verifier: Claude (gsd-verifier)_
