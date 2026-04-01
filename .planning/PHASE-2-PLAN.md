# Phase 2 Plan — AI Ark CLI

**Date:** 2026-04-01
**Status:** v1.0 complete, phase 2 scope defined
**Repo:** `C:/Users/mitch/Everything_CC/ai-ark-cli/`

---

## Current Status

### Working (v1.0)

| Command | Endpoint | Notes |
|---|---|---|
| `credits` | `GET /payments/credits` | Fully working |
| `companies search` | `POST /companies` | Working. `--name`, `--industry`, `--technology` silently don't filter (Gap 3) |
| `people search` | `POST /people` | Working. `--company`, `--title`, `--name`, `--skills` silently don't filter (Gap 3) |
| `people lookup` | `POST /people/reverse-lookup` | Fully working |
| `people phone` | `POST /people/mobile-phone-finder` | Fully working |
| `people analyze` | `POST /people/analysis` | Works, response coverage unaudited (Gap 2) |
| `people export` | `POST /people/export` (async) | Working. Same filter bug as people search |
| `people find-emails` | `POST /people/email-finder` (async) | Fully working |

### Missing
- `people export-one` — single-person enrichment (`POST /people/export/single`) not implemented (Gap 1)

### Broken (silently)
- `FilterWithAllAnyPlusSearchMatch` fields — `--company`, `--industry`, `--technology`, `--title`, `--name`, `--skills` accept input without error but return unfiltered results (Gap 3)

---

## Task Breakdown (Priority Order)

---

### Task 1: Add `people export-one`

**Effort:** ~1 hour | **Unknowns:** None

#### Endpoint
```
POST https://api.ai-ark.com/api/developer-portal/v1/people/export/single
```
Synchronous — no polling. Takes AI Ark person `id` OR LinkedIn `url`, returns full profile + verified email.

#### Files

**Create `src/commands/people-export-one.ts`** — model after `src/commands/people-lookup.ts`
- `--id <aiArkPersonId>` — from prior `people search` result
- `--linkedin <url>` — LinkedIn profile URL
- `--format json|csv|table` (default json)
- `--clay-table <id>`
- Validate: exit 1 with message if neither `--id` nor `--linkedin` provided
- Request body: `{ id?: string; url?: string }`
- Response: single person object with `email` and `emailVerified` fields
- Clay push: wrap result in array `[result]`

**Edit `src/types/requests.ts`** — add:
```typescript
/** POST /people/export/single */
export interface ExportSingleRequest {
  id?: string;
  url?: string;
}
```

**Edit `src/types/api.ts`** — add to `ApiEndpoint` union:
```typescript
| "/people/export/single"
```

**Edit `src/index.ts`** — import and register:
```typescript
import { peopleExportOneCommand } from "./commands/people-export-one.js";
// ...
people.addCommand(peopleExportOneCommand());
```

#### Test Commands
```bash
bun run src/index.ts people export-one --help

# By LinkedIn URL
bun run src/index.ts people export-one \
  --linkedin "https://www.linkedin.com/in/mitchell-keller" --format json

# By AI Ark ID (get one from: people search --domain leadgrow.ai --size 1)
bun run src/index.ts people export-one --id <id> --format json

# Verify error when no flags
bun run src/index.ts people export-one
# Expected: Error message + exit 1
```

---

### Task 2: Audit `people analyze` Response

**Effort:** ~30 min | **Unknowns:** Response shape

#### What to Do
1. Run live test, capture raw JSON:
```bash
bun run src/index.ts people analyze \
  --linkedin "https://www.linkedin.com/in/mitchell-keller" --format json
```

2. Compare actual response against `PersonalityAnalysisResponse` in `src/types/responses.ts`. Look for extra fields: `communicationStyle`, `discType`, `strengths`, `weaknesses`, `motivators`, `buyingStyle`, `category` on traits.

3. If response has unlisted fields → update `PersonalityAnalysisResponse` and/or `PersonalityTrait` in `src/types/responses.ts`. No command changes needed — command passes full response through `formatOutput`.

---

### Task 3: Crack `FilterWithAllAnyPlusSearchMatch` Format

**Effort:** 2-4h investigation + 30min fix | **Unknowns:** Correct body format

#### Problem
`FilterWithAllAny` fields (domain, seniority, department, location) work correctly with:
```json
{ "any": { "include": ["value"] } }
```

`FilterWithAllAnyPlusSearchMatch` fields (name, industries, technologies, title, fullName, skills) silently return unfiltered results with the same format. MCP confirms the API supports name filtering (1742 results for "Salesforce") — so the format is just wrong.

#### Curl Tests to Run (in order)

Set baseline first:
```bash
curl -s -X POST https://api.ai-ark.com/api/developer-portal/v1/companies \
  -H "Content-Type: application/json" -H "X-TOKEN: $AI_ARK_API_KEY" \
  -d '{"page":0,"size":1}' | jq '.totalElements'
# Note this number — a working filter returns much less
```

**Test C (most likely — searchValue + searchMode at filter level):**
```bash
curl -s -X POST https://api.ai-ark.com/api/developer-portal/v1/companies \
  -H "Content-Type: application/json" -H "X-TOKEN: $AI_ARK_API_KEY" \
  -d '{"page":0,"size":1,"account":{"name":{"searchValue":"Salesforce","searchMode":"SMART"}}}' \
  | jq '.totalElements'
```

**Test D (searchValue alone):**
```bash
curl -s -X POST https://api.ai-ark.com/api/developer-portal/v1/companies \
  -H "Content-Type: application/json" -H "X-TOKEN: $AI_ARK_API_KEY" \
  -d '{"page":0,"size":1,"account":{"name":{"searchValue":"Salesforce"}}}' \
  | jq '.totalElements'
```

**Test A (searchValue inside any):**
```bash
curl -s -X POST https://api.ai-ark.com/api/developer-portal/v1/companies \
  -H "Content-Type: application/json" -H "X-TOKEN: $AI_ARK_API_KEY" \
  -d '{"page":0,"size":1,"account":{"name":{"any":{"searchValue":"Salesforce"}}}}' \
  | jq '.totalElements'
```

**Test F (include + searchMode at parent level):**
```bash
curl -s -X POST https://api.ai-ark.com/api/developer-portal/v1/companies \
  -H "Content-Type: application/json" -H "X-TOKEN: $AI_ARK_API_KEY" \
  -d '{"page":0,"size":1,"account":{"name":{"any":{"include":["Salesforce"]},"searchMode":"SMART"}}}' \
  | jq '.totalElements'
```

**Test G (values plural):**
```bash
curl -s -X POST https://api.ai-ark.com/api/developer-portal/v1/companies \
  -H "Content-Type: application/json" -H "X-TOKEN: $AI_ARK_API_KEY" \
  -d '{"page":0,"size":1,"account":{"name":{"any":{"values":["Salesforce"]}}}}' \
  | jq '.totalElements'
```

A working format returns a small specific count (e.g. ~1742) vs the ~70M unfiltered baseline.

#### If All Tests Fail — Support Email

Subject: `REST API — FilterWithAllAnyPlusSearchMatch body format for account.name`

> I'm integrating with your REST API and can't get `account.name` to filter on `POST /companies`. Every format returns the full unfiltered result set. The MCP tool works fine for name filtering (returns ~1742 for "Salesforce") so I know the API supports it.
>
> Formats tried:
> - `{"account":{"name":{"any":{"include":["Salesforce"]}}}}`
> - `{"account":{"name":{"searchValue":"Salesforce","searchMode":"SMART"}}}`
> - `{"account":{"name":{"any":{"searchValue":"Salesforce"}}}}`
>
> Could you share the correct JSON body format? A working curl example would be ideal. Same question applies to: `account.industries`, `account.technologies`, `contact.experience.currentTitle`, `contact.fullName`, `contact.skills`.

#### Code Changes (once format is known)

Update these files to use the correct format:
- `src/commands/companies-search.ts` — `applyFilters()` for name, industry, technology
- `src/commands/people-search.ts` — `applyContactFilters()` for title, name, skills; account block for company, industry
- `src/commands/people-export.ts` — inline account/contact filter construction
- `src/types/common.ts` — update `FilterWithAllAnyPlusSearchMatch` interface if shape is wrong

#### Test Commands (post-fix)
```bash
bun run src/index.ts companies search --name "Salesforce" --size 1 --format json | jq '.totalElements'
# Expected: ~1742, not ~70M

bun run src/index.ts people search --title "Head of Growth" --size 3 --format json | jq '.totalElements'

bun run src/index.ts people search --name "Mitchell Keller" --size 1 --format json | jq '.content[0].profile.full_name'
# Expected: "Mitchell Keller"
```

---

### Task 4: Add Exclude Filter Flags (Nice-to-Have)

**Effort:** ~1-2h | **Do after Tasks 1-3**

`FilterCondition` already has `exclude?: string[]` — it's just not wired up in the commands.

Add to `people search`, `people export`, `companies search`:
- `--exclude-seniority <levels...>`
- `--exclude-department <depts...>`
- `--exclude-location <locs...>`
- `--exclude-domain <domains...>`

After Task 3 resolved, also add:
- `--exclude-industry`, `--exclude-title`

Pattern:
```typescript
if (seniority || excludeSeniority) {
  body.contact.seniority = {
    any: {
      ...(seniority ? { include: seniority } : {}),
      ...(excludeSeniority ? { exclude: excludeSeniority } : {}),
    }
  };
}
```

---

## Filter Reference

### Working (FilterWithAllAny)
| Field | Confirmed Format |
|---|---|
| `account.domain` | `{ all: { include: ["leadgrow.ai"] } }` |
| `contact.seniority` | `{ any: { include: ["vp"] } }` |
| `contact.department` | `{ any: { include: ["sales"] } }` |
| `contact.location` | `{ any: { include: ["Canada"] } }` |
| `account.employeeSize` | `{ all: [[50, 200]] }` |

### Broken (FilterWithAllAnyPlusSearchMatch)
| Flag | API Field |
|---|---|
| `companies --name` | `account.name` |
| `companies --industry` | `account.industries` |
| `companies --technology` | `account.technologies` |
| `people --company` | `account.name` |
| `people --title` | `contact.experience.currentTitle` |
| `people --name` | `contact.fullName` |
| `people --skills` | `contact.skills` |

---

## Resume Checklist

```bash
# 1. Set API key (stored in C:/Users/mitch/Everything_CC/.env)
export AI_ARK_API_KEY=a65952ac22f7479b9e05758713aa37e9

# 2. Sanity checks
cd C:/Users/mitch/Everything_CC/ai-ark-cli
bun run src/index.ts credits
bun run src/index.ts companies search --domain leadgrow.ai --format json | jq '.totalElements'
bun run src/index.ts people search --domain hubspot.com --seniority vp --size 3 --format table

# 3. Confirm broken filter (should return ~70M not ~1742)
bun run src/index.ts companies search --name "Salesforce" --size 1 --format json | jq '.totalElements'
```

## Key Architecture Notes

- Runtime: Bun 1.3.9. Run source directly: `bun run src/index.ts`
- Auth: `X-TOKEN` header. Key from env `AI_ARK_API_KEY`
- All commands: Commander options → typed request body → `client.post()` → `formatOutput()`
- Async commands use `pollUntilDone()` from `src/client/poller.ts`. `--no-wait` skips polling, returns trackId
- Filter types: `src/types/common.ts`. Request bodies: `src/types/requests.ts`. Responses: `src/types/responses.ts`
- Clay push: `src/io/index.ts` → `pushToClay()`

## File Map

| File | Action | Task |
|---|---|---|
| `src/commands/people-export-one.ts` | Create | 1 |
| `src/types/requests.ts` | Add `ExportSingleRequest` | 1 |
| `src/types/api.ts` | Add endpoint to union | 1 |
| `src/index.ts` | Register command | 1 |
| `src/types/responses.ts` | Update if gaps found | 2 |
| `src/types/common.ts` | Update if format wrong | 3 |
| `src/commands/companies-search.ts` | Fix filter format | 3 |
| `src/commands/people-search.ts` | Fix filter format | 3 |
| `src/commands/people-export.ts` | Fix filter format | 3 |
| `src/commands/people-search.ts` | Add exclude flags | 4 |
| `src/commands/people-export.ts` | Add exclude flags | 4 |
| `src/commands/companies-search.ts` | Add exclude flags | 4 |
