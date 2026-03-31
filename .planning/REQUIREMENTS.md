# Requirements: AI Ark CLI

**Defined:** 2026-03-31
**Core Value:** Reliable, typed access to every AI Ark API endpoint from the command line with automatic async job management.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Project Setup

- [ ] **SETUP-01**: Project initializes with Bun + TypeScript, builds to single executable CLI binary
- [ ] **SETUP-02**: CLI reads API key from AI_ARK_API_KEY environment variable
- [ ] **SETUP-03**: CLI displays help text with all available commands and options

### API Client

- [ ] **API-01**: Typed HTTP client with X-TOKEN auth header for all AI Ark endpoints
- [ ] **API-02**: Rate limiter enforces 5 req/sec, 300/min, 18K/hr globally across all commands
- [ ] **API-03**: Full TypeScript types for all 14 API request/response schemas (derived from real response examples)
- [ ] **API-04**: Error handling surfaces API error messages clearly (status code, message, path)

### Core Commands

- [ ] **CMD-01**: `ai-ark companies search` wraps company search endpoint with filter flags
- [ ] **CMD-02**: `ai-ark people search` wraps people search endpoint with account + contact filter flags
- [ ] **CMD-03**: `ai-ark people lookup` wraps reverse people lookup (email/phone to person)
- [ ] **CMD-04**: `ai-ark people phone` wraps mobile phone finder
- [ ] **CMD-05**: `ai-ark people analyze` wraps personality analysis endpoint
- [ ] **CMD-06**: `ai-ark credits` wraps fetch credit endpoint

### Async Export Commands

- [ ] **ASYNC-01**: `ai-ark people export` submits export-with-email job, auto-polls until done, fetches and outputs results
- [ ] **ASYNC-02**: `ai-ark people find-emails` submits email finder from trackId, auto-polls until done, fetches and outputs results
- [ ] **ASYNC-03**: Progress display during polling shows state, total, found counts with elapsed time
- [ ] **ASYNC-04**: Both async commands support --no-wait flag to return trackId immediately for manual management

### Input Handling

- [ ] **INPUT-01**: CSV file input via --input flag with configurable column mapping (--domain-col, --name-col, etc.)
- [ ] **INPUT-02**: Stdin/pipe input for tool chaining (reads JSON or newline-delimited values)
- [ ] **INPUT-03**: Inline filter flags for ad-hoc queries (--domain, --industry, --seniority, --title, etc.)

### Output Handling

- [ ] **OUT-01**: JSON output (default) to stdout for piping
- [ ] **OUT-02**: CSV output via --format csv flag
- [ ] **OUT-03**: Console table output via --format table for quick review
- [ ] **OUT-04**: Direct Clay table push via --clay-table flag (uses Clay CLI under the hood)

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
| SETUP-01 | Phase 1 | Pending |
| SETUP-02 | Phase 1 | Pending |
| SETUP-03 | Phase 1 | Pending |
| API-01 | Phase 1 | Pending |
| API-02 | Phase 1 | Pending |
| API-03 | Phase 1 | Pending |
| API-04 | Phase 1 | Pending |
| CMD-01 | Phase 2 | Pending |
| CMD-02 | Phase 2 | Pending |
| CMD-03 | Phase 2 | Pending |
| CMD-04 | Phase 2 | Pending |
| CMD-05 | Phase 2 | Pending |
| CMD-06 | Phase 2 | Pending |
| ASYNC-01 | Phase 3 | Pending |
| ASYNC-02 | Phase 3 | Pending |
| ASYNC-03 | Phase 3 | Pending |
| ASYNC-04 | Phase 3 | Pending |
| INPUT-01 | Phase 4 | Pending |
| INPUT-02 | Phase 4 | Pending |
| INPUT-03 | Phase 4 | Pending |
| OUT-01 | Phase 4 | Pending |
| OUT-02 | Phase 4 | Pending |
| OUT-03 | Phase 4 | Pending |
| OUT-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after initial definition*
