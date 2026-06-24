# Domain Layout

## Context Model

ai-ark-cli is a **single-context** project. There is one CLI, one upstream API (AI Ark REST), and one user identity (API key). There are no multi-tenant boundaries, no workspace isolation, and no client-specific configuration — the API key determines everything.

## Domain Boundary

```
User (CLI flags)
    │
    ▼
src/filters.ts         ← translates CLI vocabulary into API filter shapes
    │
    ▼
src/client/http.ts     ← HTTP + auth layer (X-TOKEN header)
    │
    ▼
AI Ark REST API        ← external system (api.ai-ark.com)
    │
    ▼
src/io/                ← output layer (format, persist, push to Clay)
```

The domain splits cleanly into four concerns:

1. **Filter construction** — mapping human-readable CLI flags to the nested AI Ark filter schema (`AllAny`, `SearchMatch`, `Range`)
2. **HTTP transport** — authenticated fetch with rate limiting and 429 backoff
3. **Async job management** — polling export/email-finder jobs until terminal state
4. **Output routing** — JSON/CSV/table formatting, auto-persist to `~/.ai-ark/results/`, and optional Clay push

## Where Domain Docs Live

| Content | Location |
|---------|----------|
| Ubiquitous language | `docs/domain/glossary.md` |
| Architecture decisions | `docs/domain/adr/` |
| URL grammar reference | `docs/url-grammar.md` |
| API endpoint reference | `docs/api-reference/` |
| CLI output conventions | `.claude/rules/cli-output-conventions.md` |

## Key Domain Invariants

- **stdout is sacred.** Only serialized data (JSON/CSV/table) goes to stdout. All diagnostics go to stderr. This invariant enables `--format csv > leads.csv` to work cleanly.
- **Dry-run is free.** `--dry-run` on any search/export command must exit without making an API call and without spending credits.
- **Rate limiting is mandatory.** The rate limiter (`src/client/rate-limiter.ts`) must be active for every request. The AI Ark API enforces 5 req/s and will 429 without it.
- **Domains don't round-trip through review URLs.** Platform limitation confirmed 2026-04-10. Domains are surfaced via a side-channel markdown file (`ai-ark-domains-paste.md`) instead.
