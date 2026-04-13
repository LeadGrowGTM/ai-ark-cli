---
name: ai-ark-search
description: >
  Search and enrich contact and company data via AI Ark CLI. Interactive
  intake flow, two-tier contact search (primary tight, secondary broad),
  dry-run URL verification, and domain paste file generation for batch
  searches. Use when building prospect lists, enriching domain lists with
  contacts, finding fresh leadership hires, or running targeted people searches.
triggers:
  - search people
  - search companies
  - find contacts
  - enrich domains
  - build prospect list
  - find decision makers
  - ai ark search
  - pull contacts
  - fresh hires
  - buying window
  - enrich lead list
  - find emails for domains
version: 1.0.0
---

# AI Ark Search

Enrich company domains with best-fit contacts using the AI Ark CLI.

## Prerequisites

- API key in `.env` as `AI_ARK_API_KEY=...`
- Bun 1.3.9+ (`bun --version`)
- Verify setup: `bun run src/index.ts credits`

---

## Interactive Flow

### Intake

1. **"What are you trying to find?"**
   - People at specific companies (have domains) → domain-based search
   - People by role/keyword (no domains) → filter-based search
   - Fresh hires in leadership → job duration search

2. **"What CSV file has the company domains?"** (if domain-based)
   - Required for batch enrichment
   - Ask for column name if not obvious

3. **"What seniority/titles are you targeting?"**
   - Ask always
   - Default suggestion: VP, Director, C-suite

4. **"Any companies or domains to exclude?"**
   - Ask always for production runs
   - Accept: CSV file path or inline list

### Gap Detection

| Check | If Missing | Severity |
|-------|------------|----------|
| `bun run src/index.ts credits` works | API key missing or invalid | BLOCKING |
| Input CSV exists and has domain column | Ask for correct path/column | BLOCKING |
| Exclude file exists (if provided) | Warn, proceed without excludes | DEGRADED |

---

## Observability — Review URLs & Dry Runs

Every `people search`, `companies search`, and `people export` prints a **Review in AI Ark** link to stderr before the API call. The URL carries every non-domain filter (title include/exclude, keyword, location, duration, badge, seniority, department, skills, industry, employees, funding) — open it in your browser and the platform's filter panels pre-populate exactly.

Use `--dry-run` to print the URL and payload without hitting the API — free, no credits used:

```bash
bun run src/index.ts people search \
  --title "VP Sales" "CRO" \
  --seniority vp director c_suite \
  --employees 50-500 \
  --dry-run
```

### The 2-step verify workflow — always walk the user through both steps

**Domains do not carry into the review URL.** The platform requires a server-side session UUID that can't be generated client-side. All other filters load correctly.

When domains are present, the CLI writes the full list to `ai-ark-domains-paste.md` in the current directory:

```
🔗 Review in AI Ark: https://app.ai-ark.com/search/people?...
📋 47 include domain(s) → ai-ark-domains-paste.md
```

**Step 1 — Open the review URL.** All non-domain filters load automatically. Verify titles, keywords, location, duration, badges, seniority look correct. Fix any CLI flags before running for real.

**Step 2 — Paste domains.** Open `ai-ark-domains-paste.md`, copy the fenced list, paste into the platform's bulk include box.

```
┌─ Step 1 ─────────────┐     ┌─ Step 2 ─────────────┐
│ Open review URL →    │ ──▶ │ Paste domains →       │ ──▶ platform runs search
│ filters pre-load     │     │ into include box      │
└──────────────────────┘     └──────────────────────┘
```

Without step 2 the platform has no account scope and returns unfiltered results. Always tell the user explicitly.

---

## Two-Tier Search Strategy

For batch domain enrichment, always run two passes. Never leave domains empty after primary.

**Primary (tight)** — gets the ideal contact:
```bash
bun run src/index.ts people search \
  --input accounts.csv --domain-col "domain" \
  --seniority vp director c_suite \
  --format csv > contacts-primary.csv
```

**Secondary (broad)** — re-run domains that returned empty:
```bash
bun run src/index.ts people search \
  --input missed-accounts.csv --domain-col "domain" \
  --seniority manager senior \
  --format csv > contacts-secondary.csv
```

Or drop seniority entirely and search by `--title` or `--keyword` for the secondary pass. Every account has at least one person worth reaching out to.

---

## Common Search Patterns

### Decision makers at target accounts
```bash
bun run src/index.ts people search \
  --input accounts.csv --domain-col "Website" \
  --seniority vp director c_suite \
  --exclude-title "Intern" "Assistant" \
  --format csv > contacts.csv
```

### Fresh leadership hires (buying window)
New leaders have unspent budget and pressure to show results fast.
```bash
bun run src/index.ts people search \
  --title "VP Sales" "Head of Sales" "CRO" \
  --job-duration-max 3 \
  --seniority vp director c_suite \
  --size 200 --format csv > fresh-hires.csv
```

### Keyword search (find by responsibility, not title)
```bash
bun run src/index.ts people search \
  --keyword "revenue operations" "go to market" \
  --seniority director vp \
  --employees 100-1000 \
  --size 100 --format csv
```

### Exclude already-contacted domains
```bash
bun run src/index.ts people search \
  --input accounts.csv --domain-col "domain" \
  --seniority vp director \
  --exclude-domain-file already-contacted.csv \
  --format csv > net-new.csv
```

### Export with verified emails
```bash
bun run src/index.ts people export \
  --input accounts.csv --domain-col "domain" \
  --seniority vp director \
  --size 500 --format csv > leads-with-emails.csv
```

### Company search by funding + size
```bash
bun run src/index.ts companies search \
  --funding-type SERIES_A SERIES_B \
  --employees 50-500 \
  --industry "software" "SaaS" \
  --size 200 --format csv > target-accounts.csv
```

### Badge targeting — free InMails
`PAID_SOCIAL_MEMBERS` are LinkedIn Premium holders. No connection request needed.
```bash
bun run src/index.ts people search \
  --title "VP Sales" \
  --badge PAID_SOCIAL_MEMBERS \
  --seniority vp director \
  --size 100 --format csv
```

### Lookalike companies
Pass up to 5 domains from your best customers. Finds companies with similar firmographics.
```bash
bun run src/index.ts companies search \
  --lookalike hubspot.com notion.so figma.com \
  --size 100 --format csv
```

---

## Key Filters

| Filter | Flag | Example |
|--------|------|---------|
| Job title | `--title` | `--title "VP Sales" "CRO"` |
| Seniority | `--seniority` | `--seniority vp director c_suite` |
| Job duration | `--job-duration-max` | `--job-duration-max 3` (months in role) |
| Keywords | `--keyword` | `--keyword "data center"` |
| Employee count | `--employees` | `--employees 50-500` |
| Industry | `--industry` | `--industry "SaaS" "software"` |
| Tech stack | `--technology` | `--technology "Salesforce"` |
| Funding stage | `--funding-type` | `--funding-type SERIES_A SERIES_B` |
| Profile badge | `--badge` | `--badge PAID_SOCIAL_MEMBERS` |
| Geo radius | `--geo` | `--geo 40.71,-74.00,50km` |
| Lookalike | `--lookalike` | `--lookalike hubspot.com` |
| Exclude domains | `--exclude-domain-file` | `--exclude-domain-file contacted.csv` |
| Exclude titles | `--exclude-title` | `--exclude-title "Intern" "Assistant"` |
| Exclude badge | `--exclude-badge` | `--exclude-badge OPEN_TO_WORK` |

Full filter reference: `README.md`

---

## Output Formats

| Format | Flag | Use |
|--------|------|-----|
| CSV | `--format csv` | Spreadsheets, CRM import |
| JSON | `--format json` | Programmatic use, piping |
| Table | `--format table` | Quick terminal review |
| Clay | `--clay-table <id>` | Push directly to Clay table |

---

## Pipeline Pattern

Chain commands to build a qualified list end-to-end:

```bash
# 1. Find companies with fresh sales leadership
bun run src/index.ts people search \
  --title "VP Sales" "Head of Sales" "CRO" \
  --job-duration-max 3 --seniority vp director c_suite \
  --size 500 --format csv > fresh-hires.csv

# 2. Qualify by company size and industry
bun run src/index.ts companies search \
  --input fresh-hires.csv --domain-col domain \
  --employees 50-500 --industry "software" \
  --exclude-domain-file already-in-pipeline.csv \
  --format csv > qualified.csv

# 3. Find all decision makers
bun run src/index.ts people search \
  --input qualified.csv --domain-col domain \
  --seniority c_suite vp director \
  --exclude-title "intern" "assistant" \
  --format csv > decision-makers.csv

# 4. Export with verified emails
bun run src/index.ts people export \
  --input qualified.csv --domain-col domain \
  --seniority vp director \
  --size 1000 --format csv > final-leads.csv
```

---

## Lists Over 10,000

The AI Ark platform has inclusion/exclusion list management natively. When re-enriching, upload prior enriched lists as exclusions in-platform so you don't pay for leads you already have. The CLI cannot pre-dedupe against platform-side lists (not exposed via API), so the workflow is:

1. Export set A via CLI.
2. Exclude set A in-platform, export set B.
3. Pull both sets locally via `--format csv` or `--clay-table`.

---

## Rate Limits

5 requests/second, 300/minute, 18,000/hour. The CLI handles throttling automatically — no manual delays needed.

---

## Known Limitations

- `bulk_include_company_domain` requires a server-side session UUID — domains never round-trip into the review URL. Use the `ai-ark-domains-paste.md` file instead.
- Founded year filter is non-functional in the API as of current version.
- Geo filter (`--geo`) does not round-trip into the review URL.
