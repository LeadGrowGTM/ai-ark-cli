# Interface Depth Analysis

Analysis of public vs. internal surface area per module. Higher depth ratio = better encapsulation.

## Summary Table

| Module | Path | Public | Internal | Ratio | Verdict |
|--------|------|--------|----------|-------|---------|
| `client/http` | `src/client/http.ts` | 3 | 4 | 1.3 | SHALLOW |
| `client/rate-limiter` | `src/client/rate-limiter.ts` | 1 | 2 | 2.0 | ADEQUATE |
| `client/poller` | `src/client/poller.ts` | 1 | 2 | 2.0 | ADEQUATE |
| `filters` | `src/filters.ts` | 4 | 5 | 1.3 | SHALLOW |
| `io/format` | `src/io/format.ts` | 2 | 4 | 2.0 | ADEQUATE |
| `io/input` | `src/io/input.ts` | 2 | 2 | 1.0 | SHALLOW |
| `io/clay` | `src/io/clay.ts` | 1 | 2 | 2.0 | ADEQUATE |
| `io/persist` | `src/io/persist.ts` | 2 | 0 | N/A | SHALLOW |
| `io/tier-filter` | `src/io/tier-filter.ts` | 1 | 3 | 3.0 | ADEQUATE |
| `url-builder` | `src/url-builder.ts` | 2 | 3 | 1.5 | SHALLOW |
| `commands/*` | `src/commands/` | 1 each | ~15 each | ~15 | DEEP |

---

## Module Detail

### `src/client/http.ts` — SHALLOW (1.3)

**Public surface (3):** `AiArkClient` class, `AiArkApiError` class, `createClient()` factory function.

**Internal functions (4):** `headers` getter, `getHeaders` getter, `requestWithRetry()`, `handleResponse()`.

**Analysis:** The class boundary provides minimal encapsulation. `AiArkApiError` is necessarily public (callers `instanceof`-check it), and `createClient()` is the canonical entry point. The `requestWithRetry`/`handleResponse` split is a sensible internal decomposition, but the overall module is small enough that "shallow" is not a problem — all internals serve a clear purpose.

---

### `src/client/rate-limiter.ts` — ADEQUATE (2.0)

**Public surface (1):** `RateLimiter` class (one method: `acquire()`). `RateLimitTier` interface exported for configurability.

**Internal functions (2):** `refillAll()`, `msUntilNextToken()`.

**Analysis:** Near-ideal. Callers need only `acquire()`. The token-bucket math is hidden behind a clean async API. The exported `RateLimitTier[]` constructor parameter enables testing without depending on real time.

---

### `src/client/poller.ts` — ADEQUATE (2.0)

**Public surface (1):** `pollUntilDone()` function. `PollResult` type exported.

**Internal functions (2):** `deriveResultsEndpoint()` helper, `sleep()` utility.

**Analysis:** Good encapsulation of the dual-strategy polling logic (stats endpoint → results endpoint fallback). The `deriveResultsEndpoint` regex logic is correctly hidden. One concern: the fallback endpoint derivation is string-manipulation on an opaque `ApiEndpoint` union type — fragile if the API path changes.

---

### `src/filters.ts` — SHALLOW (1.3)

**Public surface (4):** `allAnyFilter()`, `searchMatchFilter()`, `rangeFilter()`, `buildAccountFilter()`, `buildContactFilter()`, `FilterOpts` interface. (Counting 4 functions + 1 interface as 4 exported items of substance.)

**Internal functions (5):** `toYearMonth()`, `loadExcludeDomains()`, `parseCount()`, `parseFollowerBand()`, `buildFollowerFilter()`, `parseGeo()`.

**Analysis:** The three primitive builders (`allAnyFilter`, `searchMatchFilter`, `rangeFilter`) are exported and used directly in tests or theoretically by callers. This leaks implementation detail — callers shouldn't need to know which filter shape applies to which field. The two high-level builders (`buildAccountFilter`, `buildContactFilter`) are the intended public API. The primitives should ideally be internal.

---

### `src/io/format.ts` — ADEQUATE (2.0)

**Public surface (2):** `formatOutput()` function, `OutputFormat` type.

**Internal functions (4):** `outputCsv()`, `outputTable()`, `flattenObject()`, `csvEscape()`.

**Analysis:** Clean. One entry point, four helpers behind it. `flattenObject` being internal is correct — it's an implementation detail of both CSV and table rendering.

---

### `src/io/input.ts` — SHALLOW (1.0)

**Public surface (2):** `readCsvFile()`, `readStdin()`. `InputRecord` type exported.

**Internal functions (2):** `normalizeInput()`, `parseCsvLine()`.

**Analysis:** Low ratio, but this module is genuinely thin — it wraps two I/O paths. The internal helpers are small and purpose-built. The shallow ratio reflects the module's inherent simplicity rather than a design flaw.

---

### `src/io/clay.ts` — ADEQUATE (2.0)

**Public surface (1):** `pushToClay()`.

**Internal functions (2):** `flattenForClay()`, `csvEscape()`.

**Analysis:** Good. `flattenForClay` and `csvEscape` are implementation details of the push process. Note: `csvEscape` is duplicated between `clay.ts` and `format.ts` — a shared utility would remove the redundancy.

---

### `src/io/persist.ts` — SHALLOW (N/A)

**Public surface (2):** `persistResults()`, `buildDefaultPath()` (exported for testing).

**Internal functions (0):** None.

**Analysis:** The module is intentionally thin — two functions with no internal decomposition needed. `buildDefaultPath` is exported specifically to enable unit testing of the path format without touching the filesystem. This is a correct testing-seam decision, not a leak.

---

### `src/io/tier-filter.ts` — ADEQUATE (3.0)

**Public surface (1):** `filterByProfile()` function. `Profile`, `EntityKind` types and `PERSON_TIER1_FIELDS`, `COMPANY_TIER1_FIELDS` constants also exported (for testing/introspection).

**Internal functions (3):** `get()` (safe path accessor), `filterPerson()`, `filterCompany()`.

**Analysis:** Good encapsulation. The two entity-specific filter functions are correctly hidden. `get()` is a generic utility that could be extracted to a shared module if the pattern grows. Exporting the field constants is a useful affordance for callers that want to know what shape to expect.

---

### `src/url-builder.ts` — SHALLOW (1.5)

**Public surface (2):** `buildSearchUrl()`, `printReviewUrl()`. `SearchSurface` type exported.

**Internal functions (3):** `joinMulti()`, `encodeDuration()`, `encodeLocation()`.

**Analysis:** The two public functions serve different purposes (`buildSearchUrl` returns a string; `printReviewUrl` is a side-effectful printer). This dual purpose slightly dilutes the module's interface. `printReviewUrl` also writes a file as a side effect (`ai-ark-domains-paste.md`) — a hidden side effect that makes testing and reasoning harder.

---

### `src/commands/*` — DEEP (~15)

**Public surface (1):** One exported `*Command()` factory function per file.

**Internal functions (~15):** All command business logic is internal — option parsing, validation, batch iteration, API call construction, output routing.

**Analysis:** Excellent encapsulation. Command files expose exactly one thing to the outside world. The internal complexity (15+ steps in `people-search.ts`) is fully hidden. This is the best-encapsulated layer in the codebase.
