# Domain Glossary — Ubiquitous Language

Terms extracted from the codebase, API contracts, and CLI surface. Use these exact terms in code, issues, and documentation.

| Term | Definition | Key Files |
|------|-----------|-----------|
| **AllAny filter** | Filter shape `{ all: { include: [], exclude: [] } }` or `{ any: { ... } }`. Used for domains, seniority, department, location, badge, linkedin. The `all` key means every value must match; `any` means at least one. | `src/filters.ts`, `src/types/common.ts` |
| **SearchMatch filter** | Filter shape `{ any: { include: { mode: "SMART", content: [] } } }`. Used for name, title, industry, technology, keyword, skills. Supports three modes: SMART (default), WORD, STRICT. | `src/filters.ts`, `src/types/common.ts` |
| **Range filter** | Filter shape `{ type: "RANGE", range: [{ start: N, end: N }] }`. Used for employee count, revenue, retail size. Input format: `"50-200"`. | `src/filters.ts`, `src/types/common.ts` |
| **trackId** | A server-assigned UUID returned by `/people` search responses. Required as the correlation key for subsequent async operations — `people find-emails` and `people export`. | `src/types/common.ts`, `src/commands/people-find-emails.ts` |
| **X-TOKEN** | The authentication header name used by the AI Ark API. All requests must include `X-TOKEN: <api_key>`. Not a Bearer token — a custom header. | `src/client/http.ts` |
| **AiArkClient** | The single authenticated HTTP client class. Wraps fetch, adds X-TOKEN, applies rate limiting, and handles 429 backoff. One instance per command invocation. | `src/client/http.ts` |
| **RateLimiter** | Multi-tier token bucket enforcing AI Ark's API limits: 5 req/s, 300 req/min, 18,000 req/hr. Blocks (queues) rather than drops requests. | `src/client/rate-limiter.ts` |
| **PollResult** | Terminal state record returned by `pollUntilDone()`: `{ state, total, found, notFound, elapsed }`. States: DONE, FAILED, COMPLETED. | `src/client/poller.ts` |
| **review URL** | A clickable `https://app.ai-ark.com/search/people?...` URL that encodes all non-domain filters. Printed to stderr after every real search. Enables humans to verify the filter set in-platform before spending credits. | `src/url-builder.ts` |
| **dry-run** | Flag available on all search/export commands. Prints the review URL and request payload to stderr, then exits — zero API calls, zero credits spent. | `src/commands/people-search.ts`, `src/commands/companies-search.ts` |
| **ai-ark-domains-paste.md** | Markdown file written to CWD when a search includes `--domain` or `--input`. Contains domain lists in fenced code blocks for one-click copy-paste into the AI Ark platform. Needed because bulk_include_company_domain requires a server-side session UUID. | `src/url-builder.ts` |
| **FilterOpts** | The shared TypeScript interface representing all possible CLI filter flags across all commands. Passed to `buildAccountFilter()` and `buildContactFilter()` to construct the API request body. | `src/filters.ts` |
| **outbound profile** | Output shape mode (default) that strips the full API response to Tier 1 GTM-useful fields: name, title, linkedin, company, email, seniority, followers, etc. Opposite of `raw`. | `src/io/tier-filter.ts` |
| **Tier 1 fields** | The curated subset of API response fields useful for outbound GTM work. Defined as `PERSON_TIER1_FIELDS` and `COMPANY_TIER1_FIELDS` constant arrays. | `src/io/tier-filter.ts` |
| **persistResults** | Auto-save function called by every data command before `formatOutput`. Writes to `~/.ai-ark/results/YYYY-MM-DD_HH-MM_<command>.json` unless `--no-save` or `--output` is used. | `src/io/persist.ts` |
| **Clay push** | Optional output sink. When `--clay-table <id>` is passed, results are flattened to CSV and uploaded via the `clay` CLI subprocess. Requires Clay CLI installed separately. | `src/io/clay.ts` |
| **SearchSurface** | Union type `"people" | "companies"` selecting which AI Ark platform URL path to build (`/search/people` or `/search/company`). | `src/url-builder.ts` |
| **job duration** | Time in current role, expressed in months at the CLI (`--job-duration-min`, `--job-duration-max`) and converted to `{ year, month }` objects for the API. | `src/filters.ts` |
| **follower band** | Social reach filter syntax for LinkedIn followers/connections. Accepts `k` suffix (e.g. `5k`), ranges (`1k-2k`), open-ended (`5k+`), and upper-bounded (`<500`). | `src/filters.ts` |
| **seniority** | Enumerated level in an organization hierarchy. Valid values: `founder`, `c_suite`, `vp`, `director`, `head`, `manager`, `senior`, `mid-level`, `entry`, `intern`. Used as an AllAny filter. | `src/commands/people-search.ts`, `src/filters.ts` |
