# AI Ark CLI

## What This Is

A composable command-line tool that wraps the AI Ark API for people search and data enrichment. Takes CSV or piped input, enriches it with emails, phone numbers, and profile data via AI Ark's API, and outputs to CSV, JSON, console tables, or pushes directly to Clay. The CLI is intentionally dumb. All business logic (persona definitions, exclusion rules, conversational targeting) lives in a separate skill layer that invokes the CLI as a building block.

## Core Value

Reliable, typed access to every AI Ark API endpoint from the command line, with automatic async job management (polling, progress, result fetching) so enrichment workflows can be scripted and piped.

## Current Milestone: v1.1 Data Preservation & Export Pipeline

**Goal:** Make every API result persist to disk automatically and streamline the search→export→email workflow into one command.

**Target features:**
- Auto-persist: every data command saves a timestamped file to `~/.ai-ark/results/` (opt-out via `--no-save`)
- `--output <file>` flag on all data commands for explicit saves
- Field tier classification (Tier 1 = GTM gold, Tier 2 = research-useful, Tier 3 = noise/expiring), documented in `FIELD-TIERS.md`
- `--profile outbound|research|raw` flag filters output to the right tier subset
- `people pipeline` command: chains search → export → find-emails in one call with auto-persist

## Requirements

### Validated

(None yet — ship to validate)

### Active (v1.1)

- [ ] `people pipeline` command chaining search → export → find-emails with auto-persist

### Validated (v1.1 — Phase 5 complete 2026-04-29)

- [x] Auto-persist all API results to `~/.ai-ark/results/` on every data command
- [x] `--output <file>` explicit save flag on all data commands
- [x] `--no-save` flag to suppress auto-save on any data command
- [x] Field tier classification system (Tier 1/2/3) with `docs/FIELD-TIERS.md` documentation
- [x] `--profile outbound|raw` output filter flag on all 7 data commands (default: outbound = Tier 1 fields only)

### Validated (v1.0)

- [x] Wrap all 14 AI Ark API endpoints as CLI commands
- [ ] CSV input for batch enrichment jobs
- [ ] Stdin/pipe input for tool chaining
- [x] CSV output format
- [x] JSON output format
- [x] Console table output for quick review
- [x] Direct Clay table push
- [x] Auto-polling for async export people workflow (submit -> poll -> fetch results with progress)
- [x] Auto-polling for async email finder workflow (submit -> poll -> fetch results with progress)
- [x] Full TypeScript types for all API request/response schemas
- [x] Auth via AI_ARK_API_KEY environment variable
- [x] Rate limit handling (5/sec, 300/min, 18K/hr)
- [x] Schema examples captured from real API responses for reference

### Out of Scope

- Persona/exclusion logic — belongs in the skill layer, not the CLI
- Company data discovery — done via AI Ark browser UI, not API
- Webhook server — CLI polls instead; webhook support is for external integrations
- Default filter configs — the skill layer handles smart defaults
- GUI or TUI — pure CLI, composable with pipes

## Context

- AI Ark API docs captured locally at `docs/api-reference/` (17 pages, scraped 2026-03-26)
- Two async workflow patterns: Export People (POST -> trackId -> poll stats -> GET results) and Email Finder (people search trackId -> POST email-finder -> poll -> GET results)
- Email finder trackIds are single-use and expire after 6 hours
- All emails verified in real time by BounceBan
- Rate limits are global: 5 req/sec, 300/min, 18K/hr across all endpoints
- This CLI will be invoked by a LeadGrow skill that handles the conversational persona-building and exclusion logic
- Company search endpoint exists but primary company list building happens through AI Ark's browser UI where filters can be explored visually
- The skill layer above will handle standard exclusions (no assistants, students, interns, junior titles)

## Constraints

- **Stack**: Bun + TypeScript — consistent with LeadGrow workspace runtime
- **Auth**: Environment variable only (AI_ARK_API_KEY) — no keys in config files
- **API rate limits**: Must respect 5/sec, 300/min, 18K/hr globally
- **Export cap**: Max 10,000 results per export people request
- **TrackId expiry**: Email finder trackIds expire 6 hours after people search response, single-use

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CLI stays dumb, skill layer adds intelligence | Composability over convenience. CLI is a building block. | — Pending |
| Bun + TypeScript over Python | Workspace consistency, type safety on complex API schemas | — Pending |
| Auto-poll over webhook for async jobs | Simpler for CLI usage. No server to run. Progress visible in terminal. | — Pending |
| Env var auth only | Security (no keys in files), simplicity, CI/CD friendly | — Pending |
| All 4 output formats (CSV, JSON, table, Clay push) | Maximum composability for different workflow contexts | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? Move to Out of Scope with reason
2. Requirements validated? Move to Validated with phase reference
3. New requirements emerged? Add to Active
4. Decisions to log? Add to Key Decisions
5. "What This Is" still accurate? Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-29 — Phase 5 complete (persistence + tier filter, 13/13 verified)*
