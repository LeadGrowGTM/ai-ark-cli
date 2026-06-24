# Deepening Opportunities

Concrete improvements to encapsulation, testability, and maintainability. Each item is actionable without breaking existing behavior.

---

## 1. Unexport primitive filter builders from `filters.ts`

**Problem:** `allAnyFilter()`, `searchMatchFilter()`, and `rangeFilter()` are exported from `src/filters.ts`. These are implementation details of the filter-construction pipeline — callers outside the module shouldn't need to pick which shape to use for which field. Their export leaks the API's internal filter-shape taxonomy.

**Proposed Solution:** Make them unexported (`function` instead of `export function`). The public API is `buildAccountFilter()` and `buildContactFilter()` — those are what command files call. If tests need to verify filter shapes, they should assert on the output of the high-level builders, not the primitives.

**Impact:** MEDIUM — Improves encapsulation, doesn't change behavior. Requires adjusting any tests that import the primitives directly.

---

## 2. Extract `csvEscape` into a shared utility

**Problem:** `csvEscape` is duplicated verbatim in both `src/io/clay.ts` and `src/io/format.ts`. Same function, same logic, two places to update if the CSV escaping rules change.

**Proposed Solution:** Create `src/io/csv-util.ts` exporting `csvEscape()` and `parseCsvLine()` (the latter already exists in `input.ts`). Import from this shared module in `format.ts`, `clay.ts`, and `input.ts`.

**Impact:** LOW — Pure refactor, zero behavior change. Makes the IO layer internally consistent.

---

## 3. Make `printReviewUrl` side-effect-free; separate the file write

**Problem:** `printReviewUrl()` in `src/url-builder.ts` does two things: (1) builds and prints the URL to stderr, and (2) writes `ai-ark-domains-paste.md` to CWD as a side effect. The file write is invisible from the call site and makes the function non-trivially hard to test.

**Proposed Solution:** Split into two functions: `printReviewUrl(opts, surface)` (URL only to stderr) and `writeDomainPasteFile(opts)` (file write, returns the path or null). Command files call both explicitly. The file write side effect becomes visible at the call site.

**Impact:** MEDIUM — Improves testability. No behavior change from user's perspective. Requires updating all call sites.

---

## 4. Add a testability seam to `AiArkClient` (inject the fetcher)

**Problem:** `AiArkClient.get()` and `.post()` call the global `fetch()` directly. There is no way to inject a mock fetcher, which means testing command logic requires either a live API key or HTTP interceptors.

**Proposed Solution:** Accept an optional `fetcher` parameter in the `AiArkClient` constructor (type: `typeof fetch`). Defaults to the global `fetch`. Tests pass a mock fetcher that returns canned responses. This is the minimal seam needed for unit-testing commands without network calls.

**Impact:** HIGH — Unblocks testing the entire command pipeline without an API key. Small change to `http.ts`, large benefit to test coverage.

---

## 5. Remove hardcoded Windows path from `src/index.ts`

**Problem:** `src/index.ts` contains a hardcoded fallback path `C:/Users/mitch/Everything_CC/ai-ark-cli` for `.env` loading. This is a machine-specific path that will silently fail or match the wrong directory on any other machine.

**Proposed Solution:** Remove the hardcoded fallback. The `.env` search order should be: (1) CLI's own directory, (2) CWD. Document this in CLAUDE.md and README. If a user's `.env` isn't found, the error message (already implemented) is clear enough.

**Impact:** HIGH — Prevents silent incorrect behavior on any machine that isn't the original author's. Zero user-facing behavior change for the documented setup flow.

---

## 6. `pollUntilDone` fallback endpoint derivation is fragile

**Problem:** `deriveResultsEndpoint()` in `src/client/poller.ts` uses string replacement to convert a stats endpoint path into a results endpoint path. If the AI Ark API changes its path structure, this breaks silently at runtime with a confusing error.

**Proposed Solution:** Accept an explicit `resultsEndpoint: ApiEndpoint` parameter alongside `statsEndpoint`. Command files that call `pollUntilDone` already know both endpoints — they just don't pass the results one. Removing the string-manipulation fallback eliminates a class of future breakage.

**Impact:** MEDIUM — Makes the polling contract explicit. Requires minor updates to `people-export.ts` and `people-find-emails.ts` call sites.

---

## 7. Missing seam: batch domain processing leaks into `people-search.ts`

**Problem:** The batch-domain loop (iterate over each domain, make one API call per domain, concatenate results) lives inside `peopleSearchCommand`'s action handler in `src/commands/people-search.ts`. It's ~20 lines of business logic embedded in a 200-line command file.

**Proposed Solution:** Extract a `batchSearch(client, domains, buildBody, profile)` function to `src/commands/shared/batch.ts`. `people-search.ts` and any future commands with batch behavior call this shared function. The batch logic becomes independently testable.

**Impact:** MEDIUM — Improves testability and reusability. `people-export.ts` has similar batch behavior that would also benefit.
