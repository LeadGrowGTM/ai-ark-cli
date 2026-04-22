---
name: ai-ark-search
description: >
  Search and enrich contact and company data via AI Ark CLI. Interactive
  intake flow, three-tier title-based contact search (no seniority filter),
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
version: 1.1.0
decisions:
  - Do NOT use --seniority. Title-only targeting is more precise. Use --title with explicit persona tiers instead.
---

# AI Ark Search

Enrich company domains with best-fit contacts using the AI Ark CLI.

## Prerequisites

- API key in `.env` as `AI_ARK_API_KEY=...`
- Bun 1.3.9+ (`bun --version`)
- Verify setup: `bun run src/index.ts credits`

---

## Interactive Flow (Default Mode)

Set direction upfront with the user, then execute. Only interrupt mid-flow for genuine edge cases where the data shows something unexpected.

### Phase 0: CLI Health Check (BLOCKING)

```bash
bun run src/index.ts credits
```

If this fails, stop and resolve before proceeding.

### Intake

Gather context through conversation:
- **What are you trying to find?** People at companies (have domains) / people by role (no domains) / fresh hires
- **What CSV?** (if domain-based) Path + column name
- **Any exclusions?** CSV or inline list

### Direction Checkpoint (AskUserQuestion — bulk, 2-3 questions)

Once you have the input CSV and context, use AskUserQuestion with all questions in one call:

**Question 1 — Title tiers for this vertical:**
> "Tier 1: CEO, Founder, President, Owner. Tier 2: VP Sales, Head of Sales, CRO, Director Sales. Tier 3: COO, Managing Director, GM, VP Ops. Right for [vertical], or need different titles?"
>
> Options: "These are right (Recommended)" | "Adjust titles" | "Only run Tier 1 for now"

Adapt default titles to the vertical before presenting. Industrial → "National Sales Manager". SaaS → "Head of Growth". Agencies → "Managing Partner." Show vertical-appropriate defaults.

**Question 2 — Scope + budget:**
> "[X] domains × 3 tiers ≈ [Y] credits. Run all 3 tiers, or start with Tier 1?"
>
> Options: "All 3 tiers (Recommended)" | "Tier 1 only, decide after" | "Tier 1+2, skip Tier 3"

**Question 3 (optional) — Exclusions:**
Only if user hasn't already specified:
> "Any companies or domains to exclude before we start?"
>
> Options: "No exclusions" | "I'll provide a file" | "Exclude these domains: [let me type them]"

After answers — execute all approved tiers without interruption unless an edge-case checkpoint fires.

### Edge-Case Checkpoint (conditional — between tiers only)

**Does NOT fire** when Tier 1 coverage is normal (40%+ hit rate). Silently proceed to Tier 2 with missed domains.

**Fires when** AI Ark data reveals something the skill can't handle alone. Use AskUserQuestion with observed data:

- "Tier 1 came back 80% empty. These companies might be too small for C-suite LinkedIn presence. Try lower titles like Operations Manager, Sales Manager, Business Development Manager?"
- "Noticed 15 domains have only 1 employee on LinkedIn. Skip these or try broader titles?"
- "Found 3+ contacts per domain average — cap at 2 to save credits, or keep all?"

Options should always include the data-informed recommendation marked `(Recommended)`.

### Gap Detection

| Check | If Missing | Severity |
|-------|------------|----------|
| `bun run src/index.ts credits` works | API key missing or invalid | BLOCKING |
| Input CSV exists and has domain column | Ask for correct path/column | BLOCKING |
| Exclude file exists (if provided) | Warn, proceed without excludes | DEGRADED |

---

## Observability — Review URLs & Dry Runs

Every `people search`, `companies search`, and `people export` prints a **Review in AI Ark** link to stderr before the API call. The URL carries every non-domain filter (title include/exclude, keyword, location, duration, badge, seniority, department, skills, industry, employees, funding, revenue, founded year) — open it in your browser and the platform's filter panels pre-populate exactly.

Full URL parameter reference: `references/url-parameters.md`

Use `--dry-run` to print the URL and payload without hitting the API — free, no credits used:

```bash
bun run src/index.ts people search \
  --title "VP Sales" "CRO" "CEO" "Founder" \
  --exclude-title "Intern" "Assistant" \
  --employees 50-500 \
  --dry-run
```

### Link Presentation (AskUserQuestion — after each search command)

After every search/export command completes, **ask the user if they want to see the review link.** Use AskUserQuestion:

> "Search returned [X] results. Want me to show the AI Ark review link so you can verify filters in-platform?"
>
> Options: "Yes, show me the link" | "No, just the results" | "Show link + domain paste instructions"

**If user says yes (or chose "show link"):**
1. Present the review URL as a clickable link
2. If domains were involved, also explain the 2-step verify workflow (see below)
3. Reference specific filters that loaded into the URL so the user knows what to look for

**If user says no:** Skip link display, continue to next tier or wrap up.

**If user says "show link + domain paste":** Show both the URL and the domain paste file instructions.

This preference carries forward within a session — if they said "no" once, don't ask again for subsequent tiers. If they said "yes" once, show links for all remaining tiers without re-asking.

### The 2-step verify workflow

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

## Three-Tier Title Search Strategy

**Do NOT use `--seniority`.** Title-only targeting is more precise — AI Ark's seniority classifications don't reliably map to decision-makers. Use explicit `--title` tiers instead.

**Tier 1 — Owners / founders** (highest intent)
- CEO, Founder, Co-Founder, President, Owner
- Confirm exact titles for the vertical with the user before running

**Tier 2 — Revenue leaders** (own pipeline, feel the problem daily)
- VP Sales, Head of Sales, Director of Sales, CRO, Chief Revenue Officer
- VP Business Development, Director of Business Development
- Adjust for vertical: "National Sales Manager" in industrial, "Head of Growth" in SaaS

**Tier 3 — Secondary authority** (run on domains empty after Tiers 1+2)
- COO, Managing Director, General Manager, VP Operations
- At small companies these often own budget too

```bash
# Tier 1
bun run src/index.ts people search \
  --input accounts.csv --domain-col "domain" \
  --title "CEO" "Founder" "Co-Founder" "President" "Owner" \
  --exclude-title "Intern" "Assistant" \
  --format csv > contacts-t1.csv

# Tier 2
bun run src/index.ts people search \
  --input accounts.csv --domain-col "domain" \
  --title "VP Sales" "Head of Sales" "Director of Sales" "CRO" \
         "VP Business Development" "Director of Business Development" \
  --exclude-title "Intern" "Assistant" \
  --format csv > contacts-t2.csv

# Tier 3 — missed domains only
bun run src/index.ts people search \
  --input missed-accounts.csv --domain-col "domain" \
  --title "COO" "Managing Director" "General Manager" "VP Operations" \
  --exclude-title "Intern" "Assistant" \
  --format csv > contacts-t3.csv
```

Every account has at least one person worth reaching out to — never leave a domain empty after all 3 tiers.

---

## Common Search Patterns

### Decision makers at target accounts
```bash
bun run src/index.ts people search \
  --input accounts.csv --domain-col "Website" \
  --title "CEO" "Founder" "Co-Founder" "President" "Owner" \
         "VP Sales" "Head of Sales" "Director of Sales" "CRO" \
  --exclude-title "Intern" "Assistant" \
  --format csv > contacts.csv
```

### Fresh leadership hires (buying window)
New leaders have unspent budget and pressure to show results fast.
```bash
bun run src/index.ts people search \
  --title "VP Sales" "Head of Sales" "CRO" "Chief Revenue Officer" \
  --job-duration-max 3 \
  --exclude-badge OPEN_TO_WORK \
  --size 200 --format csv > fresh-hires.csv
```

### Keyword search (find by responsibility, not title)
```bash
bun run src/index.ts people search \
  --keyword "revenue operations" "go to market" \
  --employees 100-1000 \
  --size 100 --format csv
```

### Exclude already-contacted domains
```bash
bun run src/index.ts people search \
  --input accounts.csv --domain-col "domain" \
  --title "CEO" "Founder" "President" "VP Sales" "Head of Sales" \
  --exclude-domain-file already-contacted.csv \
  --format csv > net-new.csv
```

### Export with verified emails
```bash
bun run src/index.ts people export \
  --input accounts.csv --domain-col "domain" \
  --title "CEO" "Founder" "President" "VP Sales" "Head of Sales" "CRO" \
  --exclude-title "Intern" "Assistant" \
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
  --title "VP Sales" "Head of Sales" \
  --badge PAID_SOCIAL_MEMBERS \
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
| Job title | `--title` | `--title "VP Sales" "CRO"` — **use this, not seniority** |
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
  --job-duration-max 3 \
  --exclude-badge OPEN_TO_WORK \
  --size 500 --format csv > fresh-hires.csv

# 2. Qualify by company size and industry
bun run src/index.ts companies search \
  --input fresh-hires.csv --domain-col domain \
  --employees 50-500 --industry "software" \
  --exclude-domain-file already-in-pipeline.csv \
  --format csv > qualified.csv

# 3. Find all decision makers (Tier 1 + 2)
bun run src/index.ts people search \
  --input qualified.csv --domain-col domain \
  --title "CEO" "Founder" "President" "Owner" \
         "VP Sales" "Head of Sales" "CRO" "Director of Sales" \
  --exclude-title "intern" "assistant" \
  --format csv > decision-makers.csv

# 4. Export with verified emails
bun run src/index.ts people export \
  --input qualified.csv --domain-col domain \
  --title "CEO" "Founder" "President" "VP Sales" "Head of Sales" "CRO" \
  --exclude-title "intern" "assistant" \
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

## Pipeline Mode (DiscoLike → AI Ark)

When receiving a domain CSV from DiscoLike discovery (or any upstream account list), run the full 3-tier enrichment sequence with automatic missed-domain tracking.

**This mode is interactive.** Show the user: credit cost estimate, tier plan, and results per tier. Don't run all 3 tiers silently.

### Prerequisites check (BLOCKING)

```bash
bun run src/index.ts credits
```

If credits are insufficient for the domain count × 3 tiers, warn the user with the math before proceeding.

### Pipeline execution

```bash
# Tier 1 — Owners/Founders
bun run src/index.ts people search \
  --input accounts.csv --domain-col "domain" \
  --title "CEO" "Founder" "Co-Founder" "President" "Owner" \
  --exclude-title "Intern" "Assistant" \
  --format csv > contacts-t1.csv

# Show user: X domains returned results, Y domains empty
# Generate missed-domains file automatically (see format_for_ai_ark.py)

# Tier 2 — Revenue leaders (only missed domains)
bun run src/index.ts people search \
  --input missed-after-t1.csv --domain-col "domain" \
  --title "VP Sales" "Head of Sales" "Director of Sales" "CRO" \
         "VP Business Development" "Director of Business Development" \
  --exclude-title "Intern" "Assistant" \
  --format csv > contacts-t2.csv

# Tier 3 — Secondary authority (only still-missed domains)
bun run src/index.ts people search \
  --input missed-after-t2.csv --domain-col "domain" \
  --title "COO" "Managing Director" "General Manager" "VP Operations" \
  --exclude-title "Intern" "Assistant" \
  --format csv > contacts-t3.csv
```

### Missed-domain tracking

After each tier, diff input domains vs found domains to generate the next tier's input. The bridge script (`format_for_ai_ark.py` in `temp/scripts/`) handles this automatically.

### Pipeline report to user

After all tiers:
- Total contacts found across all tiers
- Coverage rate (domains with ≥1 contact / total input domains)
- Domains still empty after all 3 tiers
- Credits consumed

### Input format from DiscoLike

| DiscoLike output | AI Ark expects |
|---|---|
| `domain` (may have `www.` prefix) | `domain` (stripped, lowercase) |

Run `format_for_ai_ark.py` between DiscoLike output and AI Ark input for normalization + dedup.

---

## Known Limitations

- `bulk_include_company_domain` requires a server-side session UUID — domains never round-trip into the review URL. Use the `ai-ark-domains-paste.md` file instead.
- Founded year filter is non-functional in the API as of current version (URL param `year_founded` is mapped but API ignores it).
- Geo filter (`--geo`) does not round-trip into the review URL (stored in platform session state, no URL param).
- Revenue now maps to the URL (`revenue` param) but uses bucket labels, not raw ranges (e.g. `$1M - $10M`).
