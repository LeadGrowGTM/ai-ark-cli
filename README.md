# AI Ark CLI

Search 400M+ people and 69M+ companies from the command line. Filter, exclude, export with verified emails, and pipe results to CSV, JSON, or Clay.

## Setup

```bash
# 1. Install dependencies
bun install

# 2. Add your API key
echo "AI_ARK_API_KEY=your_key_here" > .env
# Get your key at https://app.ai-ark.com/settings/api-management/dashboard

# 3. Verify it works
bun run src/index.ts credits
```

No build step required. Bun runs TypeScript source directly.

## Commands

| Command | What it does |
|---------|-------------|
| `credits` | Check API credit balance |
| `companies search` | Search 69M+ companies by name, industry, tech, location, size |
| `people search` | Search 400M+ people by title, seniority, skills, keywords |
| `people export` | Bulk export with verified emails (async, up to 10K per request) |
| `people export-one` | Single-person enrichment by LinkedIn URL or AI Ark ID |
| `people lookup` | Reverse lookup by email address |
| `people phone` | Find mobile phone numbers |
| `people analyze` | Personality/communication analysis (DISC, OCEAN) |
| `people find-emails` | Find emails for a previous people search (by trackId) |

Run `bun run src/index.ts <command> --help` for all flags.

## Examples

### Find VPs at SaaS companies

```bash
bun run src/index.ts people search \
  --title "VP of Sales" \
  --industry "SaaS" "software" \
  --employees 50-500 \
  --seniority vp director \
  --size 25 --format table
```

### Find companies by name

```bash
bun run src/index.ts companies search --name "Salesforce" --size 5 --format json
```

### Fresh leadership hires (buying window)

```bash
bun run src/index.ts people search \
  --title "Head of Sales" "CRO" \
  --job-duration-max 3 \
  --seniority vp director c_suite \
  --size 100 --format csv
```

### Keyword search (responsibilities, not just titles)

```bash
bun run src/index.ts people search \
  --keyword "data center" "cloud migration" \
  --seniority vp director \
  --employees 200-5000 \
  --size 50 --format table
```

### Exclude companies already in your pipeline

```bash
bun run src/index.ts people search \
  --title "VP Sales" \
  --industry "software" \
  --exclude-domain-file already-contacted.csv \
  --exclude-badge OPEN_TO_WORK \
  --exclude-title "Assistant" "Intern" \
  --size 100 --format csv
```

### Export with verified emails

```bash
bun run src/index.ts people export \
  --domain hubspot.com \
  --seniority vp director \
  --size 50 --format csv
```

### Single-person enrichment

```bash
bun run src/index.ts people export-one \
  --linkedin "https://www.linkedin.com/in/someone" --format json
```

### Batch from CSV

```bash
bun run src/index.ts people search \
  --input companies.csv \
  --domain-col "Website" \
  --seniority vp director \
  --format csv > enriched.csv
```

### Series A/B companies, 50-200 employees

```bash
bun run src/index.ts companies search \
  --funding-type SERIES_A SERIES_B \
  --employees 50-200 \
  --size 100 --format csv
```

## Review Before You Spend

Every search and export command generates an AI Ark platform URL that opens your exact filter set in the browser. Use it to verify the list looks right before burning API credits — especially useful for large exports.

```bash
# --dry-run: print the review URL and exit (no API call, no credits spent)
bun run src/index.ts people search \
  --title "VP of Sales" \
  --industry "SaaS" \
  --employees 50-500 \
  --seniority vp director \
  --dry-run
```

```
[DRY RUN] Review URL (stderr):
https://app.ai-ark.com/people?...

[DRY RUN] Request payload: { ... }
```

Open that URL → confirm the list matches your intent → run without `--dry-run` to fetch results.

The review URL also prints automatically after every real search (to stderr, so it never pollutes piped output). To suppress it:

```bash
bun run src/index.ts people search --title "CRO" --no-review-url --format csv > leads.csv
```

### Domain searches require a second step

**Domains do not carry into the review URL.** This is a platform limitation — the bulk domain include requires a server-side session UUID that can't be embedded in a shareable link. Every other filter (title, seniority, keywords, location, duration, employees, industry, badges) round-trips correctly.

When your search includes domains (via `--domain` or `--input`), the CLI prints a paste list alongside the URL:

```
🔗 Review in AI Ark: https://app.ai-ark.com/people?...

📋 Paste these 3 domain(s) into the platform's bulk include box:
hubspot.com, salesforce.com, notion.so
```

Two-step workflow:
1. Open the review URL — all non-domain filters pre-load automatically
2. Copy the domain list from the CLI output and paste it into the platform's bulk include box

Without step 2, the platform search has no account scope and will return unfiltered results.

### When to use review URLs

| Situation | Workflow |
|-----------|----------|
| First time running a new filter set | `--dry-run` → inspect in browser → run for real |
| Large export (hundreds to thousands of records) | `--dry-run` → verify list in platform → `people export` |
| Debugging "why did I get these results?" | Check review URL from the previous run (printed to stderr) |
| Building a list interactively | Open URL in browser, adjust filters in platform UI, paste back as CLI flags |

The URL is a permalink — share it, save it, or open it later to see the same search on fresh data.

## Pipeline Pattern

Chain searches to build targeted lists:

```bash
# 1. Find companies with fresh sales leadership (hired last 3 months)
bun run src/index.ts people search \
  --title "VP Sales" "Head of Sales" "CRO" \
  --job-duration-max 3 --seniority vp director c_suite \
  --size 500 --format csv > fresh-hires.csv

# 2. Qualify by company size
bun run src/index.ts companies search \
  --input fresh-hires.csv --domain-col domain \
  --employees 50-500 \
  --exclude-domain-file already-in-pipeline.csv \
  --format csv > qualified.csv

# 3. Find decision makers at those companies
bun run src/index.ts people search \
  --input qualified.csv --domain-col domain \
  --seniority c_suite vp director \
  --exclude-title "intern" "assistant" \
  --format csv > decision-makers.csv

# 4. Export with verified emails
bun run src/index.ts people export \
  --input qualified.csv --domain-col domain \
  --seniority vp director \
  --size 1000 --format csv > leads-with-emails.csv
```

## Filters

### Include filters

| Flag | Available on | Type | Description |
|------|-------------|------|-------------|
| `--domain` | all people + companies | exact | Company domain |
| `--name` | companies / people | search | Company name or person name |
| `--company` | people | search | Company name |
| `--industry` | all | search | Industry classification |
| `--technology` | all | search | Tech stack |
| `--employees` | all | range | Employee count (e.g. `50-200`) |
| `--revenue` | companies | range | Revenue (e.g. `1000000-50000000`) |
| `--retail-size` | companies | range | Retail locations (e.g. `5-100`) |
| `--location` | all | exact | Location |
| `--title` | people | search | Current job title |
| `--previous-title` | people | search | Previous job title |
| `--seniority` | people | exact | `founder` `c_suite` `vp` `director` `head` `manager` `senior` `mid-level` `entry` `intern` |
| `--department` | people | exact | Department |
| `--skills` | people | search | Professional skills |
| `--keyword` | all | search | Search across headline, summary, description |
| `--badge` | people | exact | `PAID_SOCIAL_MEMBERS` `HIRING` `OPEN_TO_WORK` `CREATOR` `INFLUENCER` |
| `--job-duration-min` | people | months | Minimum months in current role |
| `--job-duration-max` | people | months | Maximum months in current role |
| `--funding-type` | companies | exact | `SEED` `SERIES_A` `SERIES_B` `SERIES_C` etc. |
| `--geo` | companies | coords | `lat,lng,radiuskm` (e.g. `40.71,-74.00,50km`) |
| `--products` | companies | search | Products/services |
| `--lookalike` | companies | domains | Find similar companies (up to 5) |

### Exclude filters

Every include filter has an exclude counterpart:

| Flag | What it excludes |
|------|-----------------|
| `--exclude-domain` | Company domains |
| `--exclude-domain-file` | Domains from a CSV file (use with `--exclude-domain-col`) |
| `--exclude-name` | Company names or person names |
| `--exclude-company` | Company names (people search) |
| `--exclude-industry` | Industries |
| `--exclude-title` | Job titles |
| `--exclude-seniority` | Seniority levels |
| `--exclude-department` | Departments |
| `--exclude-location` | Locations |
| `--exclude-badge` | Profile badges |

### Search modes

The `--match-mode` flag controls how search filters match (default: `SMART`):

- **SMART** -- contextual matching (recommended for most use cases)
- **WORD** -- individual word matching
- **STRICT** -- exact phrase matching

## Output formats

| Format | Flag | Use case |
|--------|------|----------|
| JSON | `--format json` (default) | Piping, programmatic use |
| CSV | `--format csv` | Spreadsheets, downstream tools |
| Table | `--format table` | Quick terminal review |

All commands also support `--clay-table <id>` to push results directly to a Clay table.

## Input sources

| Source | How to use |
|--------|-----------|
| CLI flags | `--domain hubspot.com` |
| CSV file | `--input file.csv --domain-col "Website"` |
| Stdin pipe | `echo '{"domain":"x.com"}' \| bun run src/index.ts people search` |

## Async commands

`people export` and `people find-emails` are async. The CLI auto-polls until results are ready and shows progress. Use `--no-wait` to get the trackId immediately and check later.

## Rate limits

The API enforces 5 requests/second, 300/minute, 18,000/hour. The CLI handles this automatically with a 3-tier token bucket rate limiter. You don't need to throttle.

## Project structure

```
src/
  index.ts              CLI entry point (Commander.js)
  filters.ts            Shared filter builders for all commands
  client/
    http.ts             Typed HTTP client with X-TOKEN auth
    rate-limiter.ts     3-tier token bucket (5/s, 300/m, 18K/h)
    poller.ts           Async job polling with progress display
  commands/             One file per command
  types/
    common.ts           Filter types, pagination, ranges
    requests.ts         Request body interfaces
    responses.ts        Response interfaces
    api.ts              Barrel export + endpoint union type
  io/
    format.ts           JSON/CSV/table output formatters
    input.ts            CSV file + stdin readers
    clay.ts             Clay table push
```
