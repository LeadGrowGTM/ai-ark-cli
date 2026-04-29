---
phase: "05"
plan: "02"
subsystem: "tier-filter"
tags: [tier-filter, profile, outbound, raw, field-tiers, GTM]
dependency_graph:
  requires: [05-01]
  provides: [TIER-01, TIER-02, TIER-03, TIER-04]
  affects: [people-search, people-export, people-find-emails, people-lookup, people-phone, people-export-one, companies-search]
tech_stack:
  added: []
  patterns: [pure-function-filter, profile-flag, tier-classification]
key_files:
  created:
    - src/io/tier-filter.ts
    - src/io/tier-filter.test.ts
    - docs/FIELD-TIERS.md
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
  - "Default profile is 'outbound' — this is a behavior change for existing pipe workflows; anyone grepping raw API fields (profile.first_name, position_groups[*]) from default output must add --profile raw"
  - "filterByProfile() runs BEFORE persistResults — saved files always match stdout shape"
  - "phones array normalized to {phoneNumber} only in outbound — strips type field"
  - "company id included in Tier 1 despite being an internal ID — needed for export-one re-enrichment flows"
  - "{content: [...], trackId: ...} wrapper shape preserved by filter — trackId still present in outbound mode"
metrics:
  duration: "6 minutes"
  completed_date: "2026-04-29"
  tasks: 3
  files_changed: 11
---

# Phase 5 Plan 2: Tier Filter & --profile Flag Summary

**One-liner:** Pure `filterByProfile()` function with `outbound` (Tier 1 GTM fields, flat shape) and `raw` (byte-equal API passthrough) profiles, wired as default into all 7 data commands, backed by finalized `docs/FIELD-TIERS.md`.

## What Was Built

### src/io/tier-filter.ts

Pure filter module with no I/O. Three exports:

- `filterByProfile(data, kind, profile)` — main function; handles single objects, arrays, and `{content: [...]}` wrappers
- `PERSON_TIER1_FIELDS` — typed tuple of outbound output key names
- `COMPANY_TIER1_FIELDS` — typed tuple of outbound output key names
- `Profile` type: `"outbound" | "raw"`
- `EntityKind` type: `"person" | "company"`

**Outbound → Tier 1 mapping (Person):**

Raw nested path → flat output key:
- `profile.first_name` → `first_name`
- `profile.last_name` → `last_name`
- `profile.headline` → `headline`
- `profile.title` → `title`
- `profile.summary` → `summary`
- `link.linkedin` → `linkedin`
- `location.{city,state,country}` → `city`, `state`, `country`
- `industry` → `industry`
- `position_groups[0].company.name` → `current_company`
- `position_groups[0].company.url` → `current_company_linkedin`
- `position_groups[0].profile_positions[0].title` → `current_title`
- `position_groups[0].date.start` → `current_role_start`
- `skills` → `skills`
- `member_badges` → `member_badges`
- `department.seniority` → `seniority`
- `email`, `emailVerified` → `email`, `emailVerified`
- `phones[].phoneNumber` → `phones[]` (type stripped)
- `last_updated` → `last_updated`

**Outbound → Tier 1 mapping (Company):**

- `id` → `id`
- `summary.description/overview/seo` → `description`, `overview`, `seo`
- `summary.staff.total` → `staff_total`
- `link.domain/linkedin` → `domain`, `linkedin`
- `contact.email` → `contact_email`
- `financial.revenue.annual.amount` → `revenue_range`
- `financial.funding.{type,total_amount,last_amount,num_investor}` → flat
- `financial.funding.rounds[].investors` → `funding_round_investors`
- `location.headquarter.raw_address` → `raw_address`
- `technologies`, `industries`, `keywords`, `last_updated` → direct

### --profile flag wiring in commands

The wiring point is **BEFORE `persistResults` and `formatOutput`** in every action handler. This ensures the saved file always contains the same shape as stdout.

Pattern for sync commands (people-search, companies-search, people-lookup, people-export-one):
```
rawData = format === "json" ? result : result.content
filtered = filterByProfile(rawData, kind, profile)
persistResults({ data: filtered, ... })
formatOutput(filtered, format)
```

Pattern for async commands (people-export, people-find-emails):
```
allResults = [...pagination results...]
filtered = filterByProfile(allResults, "person", profile)
persistResults({ data: filtered, ... })
formatOutput(filtered, format)
```

**--no-wait and --dry-run branches bypass the filter** — those paths return job metadata (`{trackId, state}`) or dry-run payloads, not entity data.

### Default behavior change

Running any data command with no flags now returns Tier 1 outbound fields by default. Before this plan, the default was the raw API response. Anyone with scripts that parse `profile.first_name` or `position_groups[*]` from piped output must add `--profile raw`.

### docs/FIELD-TIERS.md

Every Person and Company field now has a Tier assignment (1/2/3):

- **Tier 3 examples and rationale:**
  - `profile.picture.source`, `summary.logo.source`, `position_groups[*].company.logo` — CDN signed URLs that expire
  - `profile.birth_date` — always null
  - `languages.*` — almost always en-US / english
  - `location.position`, `location.default` — lat/lng (usually null) and long-form string duplicate
  - `link.twitter`, `link.github`, `link.facebook`, `link.crunchbase` — usually null
  - `summary.legal_name` — rarely populated
  - `languages[]` (companies) — almost always just "english"

- **Cross-reference:** Every Tier 1 row in the doc corresponds exactly to a field that `filterPerson`/`filterCompany` extracts. No Tier 1 field in the doc that code ignores; no field the code extracts that's not Tier 1 in the doc.

## Deviations from Plan

### Auto-detected: S3 URL format change

The plan's verify script checked for `X-Amz-Expires` in raw output. The actual API now uses `images.ai-ark.com` with `exp:` format in the URL (`exp:1777679999`). The implementation is correct — picture/logo fields are stripped in outbound profile. The verify script pattern was stale; the actual behavior was verified by checking `picture` key presence/absence.

### Auto-detected: outbound vs default trackId diff

The plan said to verify `diff ./tmp-ob.json ./tmp-default.json` — they differ by `trackId` because they're two separate API calls. This is correct behavior — the `{content: [], trackId: "..."}` wrapper is preserved by the filter, and the server generates a new `trackId` for each request. Verified that the content array (actual person data) is structurally identical.

## Known Stubs

None — all Tier 1 fields are live-wired from actual API responses.

## Self-Check: PASSED

- src/io/tier-filter.ts: FOUND
- src/io/tier-filter.test.ts: FOUND
- docs/FIELD-TIERS.md: FOUND
- 05-02-SUMMARY.md: FOUND
- Commit 12695c5 (Task 1): FOUND
- Commit 4295e91 (Task 2): FOUND
- Commit c45622d (Task 3): FOUND
