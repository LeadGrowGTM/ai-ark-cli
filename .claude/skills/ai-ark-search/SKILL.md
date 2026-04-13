---
name: ai-ark-search
description: >
  Search and enrich contact and company data via AI Ark CLI. Two-tier contact
  search (primary tight, secondary broad). Use when building prospect lists,
  enriching domain lists with contacts, finding fresh leadership hires, or
  running targeted people searches. Includes dry-run URL verification workflow
  and domain paste file generation for batch searches.
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
version: 1.0.0
---

# AI Ark Search

Search 400M+ people and 69M+ companies via the AI Ark CLI.

## Prerequisites

- API key in `.env` as `AI_ARK_API_KEY=...`
- Bun 1.3.9+ (`bun --version`)
- Verify: `bun run src/index.ts credits`

---

## Always verify before you spend

Every search generates a review URL. Run `--dry-run` first — no API call, no credits used:

```bash
bun run src/index.ts people search \
  --title "VP Sales" "CRO" \
  --seniority vp director c_suite \
  --employees 50-500 \
  --dry-run
```

The URL opens your exact filter set in the AI Ark platform. Verify it looks right, then run without `--dry-run`.

**Domain searches:** domains don't carry into the review URL (platform limitation). The CLI writes them to `ai-ark-domains-paste.md` — open the file, copy the list, paste into the platform's bulk include box.

---

## Two-Tier Contact Search

For batch domain enrichment, always run two passes:

**Primary (tight)** — gets the ideal contact first:
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

Every account gets a contact. Don't leave domains empty after primary.

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
| Exclude domains | `--exclude-domain-file` | `--exclude-domain-file contacted.csv` |
| Exclude titles | `--exclude-title` | `--exclude-title "Intern" "Assistant"` |

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

Chain searches to build a qualified list end-to-end:

```bash
# 1. Find fresh sales leadership
bun run src/index.ts people search \
  --title "VP Sales" "Head of Sales" "CRO" \
  --job-duration-max 3 --seniority vp director c_suite \
  --size 500 --format csv > fresh-hires.csv

# 2. Qualify companies by size
bun run src/index.ts companies search \
  --input fresh-hires.csv --domain-col domain \
  --employees 50-500 \
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
