# Requirements: AI Ark CLI

**Defined:** 2026-03-31
**Core Value:** Reliable, typed access to every AI Ark API endpoint from the command line with automatic async job management.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Project Setup

- [x] **SETUP-01**: Project initializes with Bun + TypeScript, builds to single executable CLI binary
- [x] **SETUP-02**: CLI reads API key from AI_ARK_API_KEY environment variable
- [x] **SETUP-03**: CLI displays help text with all available commands and options

### API Client

- [x] **API-01**: Typed HTTP client with X-TOKEN auth header for all AI Ark endpoints
- [x] **API-02**: Rate limiter enforces 5 req/sec, 300/min, 18K/hr globally across all commands
- [x] **API-03**: Full TypeScript types for all 14 API request/response schemas (derived from real response examples)
- [x] **API-04**: Error handling surfaces API error messages clearly (status code, message, path)

### Core Commands

- [x] **CMD-01**: `ai-ark companies search` wraps company search endpoint with filter flags
- [x] **CMD-02**: `ai-ark people search` wraps people search endpoint with account + contact filter flags
- [x] **CMD-03**: `ai-ark people lookup` wraps reverse people lookup (email/phone to person)
- [x] **CMD-04**: `ai-ark people phone` wraps mobile phone finder
- [x] **CMD-05**: `ai-ark people analyze` wraps personality analysis endpoint
- [x] **CMD-06**: `ai-ark credits` wraps fetch credit endpoint

### Async Export Commands

- [x] **ASYNC-01**: `ai-ark people export` submits export-with-email job, auto-polls until done, fetches and outputs results
- [x] **ASYNC-02**: `ai-ark people find-emails` submits email finder from trackId, auto-polls until done, fetches and outputs results
- [x] **ASYNC-03**: Progress display during polling shows state, total, found counts with elapsed time
- [x] **ASYNC-04**: Both async commands support --no-wait flag to return trackId immediately for manual management

### Input Handling

- [x] **INPUT-01**: CSV file input via --input flag with configurable column mapping (--domain-col, --name-col, etc.)
- [x] **INPUT-02**: Stdin/pipe input for tool chaining (reads JSON or newline-delimited values)
- [x] **INPUT-03**: Inline filter flags for ad-hoc queries (--domain, --industry, --seniority, --title, etc.)

### Output Handling

- [x] **OUT-01**: JSON output (default) to stdout for piping
- [x] **OUT-02**: CSV output via --format csv flag
- [x] **OUT-03**: Console table output via --format table for quick review
- [x] **OUT-04**: Direct Clay table push via --clay-table flag (uses Clay CLI under the hood)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Webhook Support

- **HOOK-01**: Local webhook server mode for receiving async job results instead of polling
- **HOOK-02**: Webhook URL configuration per command

### Advanced Features

- **ADV-01**: Batch mode that processes multiple searches from a config file
- **ADV-02**: Cost estimation before running (estimate credits based on filters)
- **ADV-03**: Response caching to avoid duplicate API calls for same queries

## Out of Scope

| Feature | Reason |
|---------|--------|
| Persona/exclusion logic | Belongs in skill layer, not CLI |
| Company discovery workflows | Done via AI Ark browser UI |
| Default filter configs | Skill layer handles smart defaults |
| GUI or TUI interface | Pure CLI, composable with pipes |
| MCP server wrapper | AI Ark already has their own MCP server |
| Webhook server mode | v2 consideration, polling is simpler for CLI |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 1 | Complete (01-01) |
| SETUP-02 | Phase 1 | Complete (01-02) |
| SETUP-03 | Phase 1 | Complete (01-02) |
| API-01 | Phase 1 | Complete (01-02) |
| API-02 | Phase 1 | Complete (01-02) |
| API-03 | Phase 1 | Complete (01-01) |
| API-04 | Phase 1 | Complete (01-02) |
| CMD-01 | Phase 2 | Complete (02-01) |
| CMD-02 | Phase 2 | Complete (02-01) |
| CMD-03 | Phase 2 | Complete (02-01) |
| CMD-04 | Phase 2 | Complete (02-01) |
| CMD-05 | Phase 2 | Complete (02-01) |
| CMD-06 | Phase 1 | Complete (01-02) |
| ASYNC-01 | Phase 3 | Complete (03-01) |
| ASYNC-02 | Phase 3 | Complete (03-01) |
| ASYNC-03 | Phase 3 | Complete (03-01) |
| ASYNC-04 | Phase 3 | Complete (03-01) |
| INPUT-01 | Phase 4 | Complete (04-01) |
| INPUT-02 | Phase 4 | Complete (04-01) |
| INPUT-03 | Phase 4 | Complete (04-01) |
| OUT-01 | Phase 4 | Complete (04-01) |
| OUT-02 | Phase 4 | Complete (04-01) |
| OUT-03 | Phase 4 | Complete (04-01) |
| OUT-04 | Phase 4 | Complete (04-01) |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after Phase 4 completion — ALL v1 REQUIREMENTS COMPLETE*
