# ADR-0002: Strict stdout/stderr Separation

## Status

Accepted

## Context

A common CLI antipattern is mixing diagnostic output (progress indicators, review URLs, error messages) with data output (JSON, CSV). When these are mixed, piping the CLI's output into downstream tools (`> leads.csv`, `| jq`, `| wc -l`) produces corrupted data files.

The AI Ark CLI is designed specifically to feed downstream tools: Clay tables, CSV files, `jq` pipelines, spreadsheet imports. It also prints review URLs and polling progress on every operation. These are in fundamental tension unless separated explicitly.

## Decision

**stdout carries only serialized data.** JSON arrays, CSV lines, and table-formatted output go to stdout. Nothing else.

**stderr carries everything else:**
- Error messages (`console.error`)
- Progress indicators (polling state: `PROCESSING | total: 500 | found: 120 | 34s`)
- Review URLs (`Review in AI Ark: https://...`)
- Dry-run payloads
- Auto-save confirmations (`Saved: /home/user/.ai-ark/results/...`)

This is enforced by convention (`.claude/rules/cli-output-conventions.md`) and by the architecture of the output module (`src/io/format.ts` uses `console.log` for data; everything else uses `process.stderr.write` or `console.error`).

## Consequences

**Good:**
- `bun run src/index.ts people search --format csv > leads.csv` produces a clean file with no diagnostic noise
- Review URLs and progress appear in the terminal without polluting pipes
- The table formatter can safely print `\n3 results` to stderr at the end without corrupting CSV output
- Agents that parse stdout can reliably extract structured data

**Bad:**
- Developers writing new commands must consciously choose `process.stderr.write` vs `console.log` — the wrong choice silently breaks piping
- No linting or runtime enforcement exists today to catch accidental `console.log` calls for diagnostic output in command files
- The `--no-review-url` flag exists to suppress stderr output for users who find the URL noise distracting, adding surface area
