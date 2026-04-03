# Phase 2 Plan — AI Ark CLI

**Date:** 2026-04-02
**Status:** Gap 3 (filters) FIXED. Full Phase 2 scope defined below.
**Repo:** `C:/Users/mitch/Everything_CC/ai-ark-cli/`

---

## Current Status

### Working

| Command | Endpoint | Notes |
|---|---|---|
| `credits` | `GET /payments/credits` | ✅ |
| `companies search` | `POST /companies` | ✅ All filters working (name, industries, technologies, domain, employees, location, lookalike) |
| `people search` | `POST /people` | ✅ All filters working (company, title, name, skills, seniority, department, location, linkedin, domain) |
| `people lookup` | `POST /people/reverse-lookup` | ✅ |
| `people phone` | `POST /people/mobile-phone-finder` | ✅ |
| `people analyze` | `POST /people/analysis` | Works, response types unaudited |
| `people export` | `POST /people/export` (async) | ✅ All filters working |
| `people find-emails` | `POST /people/email-finder` (async) | ✅ |

### Missing
- `people export-one` — `POST /people/export/single` not implemented

### Fixed (2026-04-02)
- ✅ SearchMatch filter format: `{ any: { include: { mode: "SMART", content: ["value"] } } }`
- ✅ Field names: `industries` (not `industry`), `technologies` (not `technology`)
- ✅ Contact field names: `departmentAndFunction` (not `department`), `skill` (not `skills`), `experience.current.title` (not `experience.currentTitle`)

---

## Verified Filter Format Reference

### SearchMatch filters (name, industries, technologies, title, fullName, skill, keyword, etc.)
```json
{ "any": { "include": { "mode": "SMART", "content": ["value"] } } }
```
With exclude:
```json
{ "any": { "include": { "mode": "SMART", "content": ["include"] }, "exclude": { "mode": "SMART", "content": ["exclude"] } } }
```

### AllAny filters (domain, seniority, location, departmentAndFunction, etc.)
```json
{ "any": { "include": ["value1"], "exclude": ["value2"] } }
```

### Range filters (employeeSize, revenue, foundedYear)
```json
{ "all": [[50, 200]] }
```

### Default mode: SMART everywhere unless user overrides.

---

## Task Breakdown

### Task 1: Add `people export-one`

**Effort:** ~1 hour | **Priority:** High

**Endpoint:** `POST /people/export/single` — synchronous, takes person `id` or LinkedIn `url`.

**Create `src/commands/people-export-one.ts`** (model after people-lookup.ts):
- `--id <aiArkPersonId>` — from prior `people search` result
- `--linkedin <url>` — LinkedIn profile URL
- `--format json|csv|table` (default json)
- `--clay-table <id>`
- Validate: exit 1 if neither `--id` nor `--linkedin`
- Response: person object with `email` and `emailVerified`

**Edit:** `src/types/api.ts` (add endpoint), `src/index.ts` (register command).
`ExportSingleRequest` already exists in `src/types/requests.ts`.

---

### Task 2: Audit `people analyze` Response

**Effort:** ~30 min | **Priority:** Low

Run live test, compare response against `PersonalityAnalysisResponse` type. Update types if extra fields found.

---

### Task 3: Exclude Flags (All Commands)

**Effort:** ~2 hours | **Priority:** Critical

Exclusions are the #1 operational need. Every production campaign needs to exclude already-found companies, specific domains, unwanted titles, etc.

**Add to `companies search`:**
- `--exclude-domain <domains...>` — exclude specific domains
- `--exclude-name <names...>` — exclude company names
- `--exclude-industry <industries...>` — exclude industries
- `--exclude-location <locations...>` — exclude locations

**Add to `people search` and `people export`:**
- `--exclude-domain <domains...>` — exclude companies by domain
- `--exclude-title <titles...>` — exclude job titles
- `--exclude-seniority <levels...>` — exclude seniority levels
- `--exclude-department <depts...>` — exclude departments
- `--exclude-location <locs...>` — exclude person locations
- `--exclude-name <names...>` — exclude person names
- `--exclude-company <names...>` — exclude company names
- `--exclude-industry <industries...>` — exclude industries

**Pattern for AllAny filters:**
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

**Pattern for SearchMatch filters:**
```typescript
if (title || excludeTitle) {
  body.contact.experience = {
    current: {
      title: {
        any: {
          ...(title ? { include: { mode: matchMode, content: title } } : {}),
          ...(excludeTitle ? { exclude: { mode: matchMode, content: excludeTitle } } : {}),
        }
      }
    }
  };
}
```

**CSV-based excludes (critical for pipeline use):**
- `--exclude-domain-file <csv>` — read domains to exclude from CSV column
- `--exclude-domain-col <name>` — column name in exclude CSV (default: "domain")

This enables: "search for VPs at SaaS companies, excluding everyone we already have in our Clay table."

---

### Task 4: Keyword Search

**Effort:** ~1.5 hours | **Priority:** Critical

Keyword is the bread and butter for finding people by responsibilities rather than titles. "AI", "data centers", "cloud migration" — the things people work on that don't show up in job titles.

**Add to `people search` and `people export`:**
- `--keyword <terms...>` — search across headline, summary, organization

**Add to `companies search`:**
- `--keyword <terms...>` — search across name, keyword, SEO, description, industry

**API fields:**
- Contact: `contact.keyword` (SearchMatch) — sources: ORGANIZATION, HEADLINE, SUMMARY
- Account: `account.keyword` (SearchMatch) — sources: NAME, KEYWORD, SEO, DESCRIPTION, INDUSTRY

**Implementation:** Same SearchMatch format as name/title.

---

### Task 5: Job Duration Filter

**Effort:** ~1.5 hours | **Priority:** Critical

New hires in leadership = buying window. Also enables company discovery: find companies that just hired sales leadership, then target decision makers.

**Add to `people search` and `people export`:**
- `--job-duration-min <months>` — minimum months in current role
- `--job-duration-max <months>` — maximum months in current role

**API field:** `contact.experience.current.duration.currentJob`
```json
{
  "min": { "year": 0, "month": 3 },
  "max": { "year": 1, "month": 0 }
}
```

**CLI converts months to year+month:**
```typescript
const toYearMonth = (months: number) => ({
  year: Math.floor(months / 12),
  month: months % 12,
});
```

**Campaign use cases:**
- `--job-duration-max 3` → hired in last 3 months (new leadership)
- `--job-duration-min 6 --job-duration-max 18` → settled but not entrenched
- Combined: `--title "VP Sales" --job-duration-max 6 --seniority vp director` → fresh sales leadership

**Two-pass pipeline pattern:**
1. `people search --title "Head of Sales" --job-duration-max 3 --size 100 --format csv > fresh-hires.csv`
2. `companies search --input fresh-hires.csv --domain-col domain --employees 50-500 --format csv > qualified-companies.csv`
3. `people search --input qualified-companies.csv --seniority c_suite vp director --format csv > decision-makers.csv`

---

### Task 6: Funding Series Filter

**Effort:** ~1 hour | **Priority:** High

Series matters more than amount. Series A vs B signals company maturity and budget.

**Add to `companies search`:**
- `--funding-type <types...>` — filter by funding round type

**API field:** `account.funding.type` — array of strings.
Values: `SEED`, `SERIES_A`, `SERIES_B`, `SERIES_C`, `SERIES_D`, `SERIES_E`, `GRANT`, `DEBT`, `CONVERTIBLE_NOTE`, `PRE_SEED`, etc.

**Add to `people search` and `people export`:**
- Same `--funding-type` flag in account block

---

### Task 7: GeoLocation Filter

**Effort:** ~1 hour | **Priority:** High

Critical for manufacturers, multi-location companies, outsourcing detection.

**Add to `companies search`:**
- `--geo <lat,lng,radius>` — e.g. `--geo 40.7128,-74.0060,50km`
- `--geo-unit <km|mi>` — default km

**API field:** `account.geoLocation`
```json
{
  "position": { "lat": 40.7128, "lng": -74.0060 },
  "radius": 50,
  "unit": "km"
}
```

**Use cases:**
- Find companies with people near a specific manufacturing hub
- Detect companies with offices in low-cost labor markets
- Target companies within a metro area

---

### Task 8: Profile Badge Filter

**Effort:** ~30 min | **Priority:** Medium

**Add to `people search` and `people export`:**
- `--badge <badges...>` — PAID_SOCIAL_MEMBERS, HIRING, OPEN_TO_WORK, CREATOR, INFLUENCER
- `--exclude-badge <badges...>` — exclude specific badges

**API field:** `contact.profileBadge` (AllAny filter)

**Primary use:** `--badge PAID_SOCIAL_MEMBERS` → free InMail targets.
**Exclude use:** `--exclude-badge OPEN_TO_WORK` → remove job seekers from lists.

---

### Task 9: Previous Title / Company + Product & Services

**Effort:** ~1.5 hours | **Priority:** Medium

**Add to `people search` and `people export`:**
- `--previous-title <titles...>` → `contact.experience.previous.title` (SearchMatch)
- `--previous-company <ids...>` → `contact.company` with previous flag (AllAny)

**Add to `companies search`:**
- `--products <terms...>` → `account.productAndServices` (SearchMatch)

**Use case (follow the champion):**
- `--previous-company <customer-company-id>` → find people who left your customer's company
- `--previous-title "VP Sales"` → find ex-sales leaders now at new companies

---

### Task 10: Revenue + Retail Size + Founded Year

**Effort:** ~1 hour | **Priority:** Low

**Add to `companies search`:**
- `--revenue <range>` — e.g. `1000000-50000000` → `account.revenue` (Range)
- `--retail-size <range>` — e.g. `5-100` → `account.retailSize` (Range)
- `--founded <range>` — e.g. `2015-2023` → `account.foundedYear` (Range)

Revenue is unreliable (Mitch confirmed: "just a guess") but included for completeness.
Retail size useful if accurate. Founded year useful for startup targeting.

---

### Task 11: Global `--match-mode` Flag

**Effort:** ~30 min | **Priority:** Medium

Add to all search commands:
- `--match-mode <mode>` — SMART (default), WORD, STRICT

Applies to all SearchMatch filters in the request. Individual filter overrides not needed (SMART covers 95% of cases).

---

## Execution Order

| Order | Task | Effort | Impact |
|---|---|---|---|
| 1 | Task 3: Exclude flags | 2h | Unblocks production use |
| 2 | Task 4: Keyword search | 1.5h | Bread and butter for persona targeting |
| 3 | Task 5: Job duration | 1.5h | Buying window detection |
| 4 | Task 6: Funding series | 1h | Company maturity signal |
| 5 | Task 1: Export-one | 1h | Single-person enrichment |
| 6 | Task 7: GeoLocation | 1h | Manufacturing/multi-location |
| 7 | Task 8: Profile badge | 30m | InMail targeting |
| 8 | Task 11: Match mode flag | 30m | Power user control |
| 9 | Task 9: Previous title/company + products | 1.5h | Follow the champion |
| 10 | Task 10: Revenue/retail/founded | 1h | Completeness |
| 11 | Task 2: Audit analyze response | 30m | Type coverage |

**Total estimated effort: ~12 hours**

---

## Key Architecture Notes

- Runtime: Bun 1.3.9. Run source directly: `bun run src/index.ts`
- Auth: `X-TOKEN` header. Key from `.env` file (`AI_ARK_API_KEY`)
- All commands: Commander options → typed request body → `client.post()` → `formatOutput()`
- Async commands use `pollUntilDone()` from `src/client/poller.ts`
- Filter types: `src/types/common.ts`. Request bodies: `src/types/requests.ts`
- Clay push: `src/io/index.ts` → `pushToClay()`
- Default search mode: SMART (all SearchMatch filters)

## File Map

| File | Tasks |
|---|---|
| `src/commands/companies-search.ts` | 3, 4, 6, 7, 9, 10, 11 |
| `src/commands/people-search.ts` | 3, 4, 5, 6, 8, 9, 11 |
| `src/commands/people-export.ts` | 3, 4, 5, 6, 8, 9, 11 |
| `src/commands/people-export-one.ts` | 1 (create) |
| `src/types/common.ts` | 11 |
| `src/types/requests.ts` | 1, 5, 6, 7, 8, 9, 10 |
| `src/types/api.ts` | 1 |
| `src/types/responses.ts` | 2 |
| `src/index.ts` | 1 |
| `src/io/index.ts` | 3 (CSV exclude reader) |

## Two-Pass Pipeline Pattern

The CLI supports chaining searches via CSV piping. With excludes + job duration, this enables:

```bash
# 1. Find companies with fresh sales leadership hires (last 3 months)
ai-ark people search --title "VP Sales" "Head of Sales" "CRO" \
  --job-duration-max 3 --seniority vp director c_suite \
  --size 500 --format csv > fresh-hires.csv

# 2. Qualify those companies by size and industry
ai-ark companies search --input fresh-hires.csv --domain-col domain \
  --employees 50-500 --industry "software" "SaaS" \
  --exclude-domain-file already-in-pipeline.csv \
  --format csv > qualified-companies.csv

# 3. Find all decision makers at qualified companies
ai-ark people search --input qualified-companies.csv --domain-col domain \
  --seniority c_suite vp director \
  --exclude-title "intern" "assistant" "coordinator" \
  --format csv > decision-makers.csv

# 4. Export with verified emails
ai-ark people export --input qualified-companies.csv --domain-col domain \
  --seniority vp director --size 1000 \
  --format csv > enriched-leads.csv
```
