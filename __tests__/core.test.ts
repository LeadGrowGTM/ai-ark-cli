/**
 * Core unit tests for ai-ark-cli.
 * Run: bun test
 *
 * Covers the filter-construction pipeline and rate limiter — the two modules
 * with the highest business criticality and zero existing test coverage.
 * Does NOT require a real API key or network access.
 */

import { describe, test, expect } from "bun:test";

// ---------------------------------------------------------------------------
// filters.ts — filter shape construction
// ---------------------------------------------------------------------------

import {
  allAnyFilter,
  searchMatchFilter,
  rangeFilter,
  buildAccountFilter,
  buildContactFilter,
} from "../src/filters.js";
import type { FilterOpts } from "../src/filters.js";

describe("allAnyFilter", () => {
  test("returns undefined when no include or exclude", () => {
    expect(allAnyFilter()).toBeUndefined();
    expect(allAnyFilter(undefined, undefined)).toBeUndefined();
  });

  test("include only — uses 'any' key by default", () => {
    const result = allAnyFilter(["hubspot.com"]);
    expect(result).toEqual({ any: { include: ["hubspot.com"] } });
  });

  test("include only — uses 'all' key when useAll=true", () => {
    const result = allAnyFilter(["hubspot.com"], undefined, true);
    expect(result).toEqual({ all: { include: ["hubspot.com"] } });
  });

  test("exclude only", () => {
    const result = allAnyFilter(undefined, ["spam.com"]);
    expect(result).toEqual({ any: { exclude: ["spam.com"] } });
  });

  test("include + exclude", () => {
    const result = allAnyFilter(["a.com"], ["b.com"]);
    expect(result).toEqual({ any: { include: ["a.com"], exclude: ["b.com"] } });
  });
});

describe("searchMatchFilter", () => {
  test("returns undefined when no include or exclude", () => {
    expect(searchMatchFilter()).toBeUndefined();
  });

  test("include with default SMART mode", () => {
    const result = searchMatchFilter(["VP of Sales"]);
    expect(result).toEqual({
      any: {
        include: { mode: "SMART", content: ["VP of Sales"] },
      },
    });
  });

  test("include + exclude with STRICT mode", () => {
    const result = searchMatchFilter(["VP Sales"], ["Intern"], "STRICT");
    expect(result).toEqual({
      any: {
        include: { mode: "STRICT", content: ["VP Sales"] },
        exclude: { mode: "STRICT", content: ["Intern"] },
      },
    });
  });

  test("exclude only", () => {
    const result = searchMatchFilter(undefined, ["intern"], "WORD");
    expect(result).toEqual({
      any: {
        exclude: { mode: "WORD", content: ["intern"] },
      },
    });
  });
});

describe("rangeFilter", () => {
  test("parses valid range string", () => {
    const result = rangeFilter("50-200");
    expect(result).toEqual({ type: "RANGE", range: [{ start: 50, end: 200 }] });
  });

  test("returns undefined for malformed range", () => {
    expect(rangeFilter("abc-def")).toBeUndefined();
    expect(rangeFilter("50")).toBeUndefined(); // no dash
  });

  test("parses revenue range", () => {
    const result = rangeFilter("1000000-50000000");
    expect(result).toEqual({ type: "RANGE", range: [{ start: 1000000, end: 50000000 }] });
  });
});

describe("buildAccountFilter", () => {
  test("returns undefined when no filters provided", () => {
    expect(buildAccountFilter({}, "people")).toBeUndefined();
    expect(buildAccountFilter({}, "company")).toBeUndefined();
  });

  test("domain filter uses 'all' key", () => {
    const opts: FilterOpts = { domain: ["hubspot.com", "salesforce.com"] };
    const result = buildAccountFilter(opts, "people");
    // Domains use allAnyFilter with useAll=true → { all: { include: [...] } }
    expect(result?.domain).toEqual({ all: { include: ["hubspot.com", "salesforce.com"] } });
  });

  test("employee size builds range filter", () => {
    const opts: FilterOpts = { employees: "50-200" };
    const result = buildAccountFilter(opts, "people");
    expect(result?.employeeSize).toEqual({ type: "RANGE", range: [{ start: 50, end: 200 }] });
  });

  test("industry uses WORD match mode", () => {
    const opts: FilterOpts = { industry: ["SaaS", "software"] };
    const result = buildAccountFilter(opts, "people");
    expect(result?.industries).toEqual({
      any: {
        include: { mode: "WORD", content: ["SaaS", "software"] },
      },
    });
  });

  test("company context uses --name for account name", () => {
    const opts: FilterOpts = { name: ["Salesforce"] };
    const result = buildAccountFilter(opts, "company");
    expect(result?.name).toBeDefined();
  });

  test("people context uses --company for account name", () => {
    const opts: FilterOpts = { company: ["HubSpot"] };
    const result = buildAccountFilter(opts, "people");
    expect(result?.name).toBeDefined();
  });

  test("funding type filter", () => {
    const opts: FilterOpts = { fundingType: ["SERIES_A", "SERIES_B"] };
    const result = buildAccountFilter(opts, "company");
    expect(result?.funding).toEqual({ type: ["SERIES_A", "SERIES_B"] });
  });
});

describe("buildContactFilter", () => {
  test("returns undefined when no contact filters provided", () => {
    // Account-only opts should not create a contact filter
    expect(buildContactFilter({})).toBeUndefined();
  });

  test("seniority uses AllAny filter", () => {
    const opts: FilterOpts = { seniority: ["vp", "director"] };
    const result = buildContactFilter(opts);
    expect(result?.seniority).toEqual({ any: { include: ["vp", "director"] } });
  });

  test("title uses SearchMatch filter with SMART mode", () => {
    const opts: FilterOpts = { title: ["Head of Sales"], matchMode: "SMART" };
    const result = buildContactFilter(opts);
    expect(result?.experience?.current?.title).toEqual({
      any: { include: { mode: "SMART", content: ["Head of Sales"] } },
    });
  });

  test("exclude title is set correctly", () => {
    const opts: FilterOpts = { excludeTitle: ["Intern", "Assistant"] };
    const result = buildContactFilter(opts);
    expect(result?.experience?.current?.title).toEqual({
      any: { exclude: { mode: "SMART", content: ["Intern", "Assistant"] } },
    });
  });

  test("job duration converts months to year+month object", () => {
    // 15 months = 1 year, 3 months
    const opts: FilterOpts = { jobDurationMin: "15", jobDurationMax: "36" };
    const result = buildContactFilter(opts);
    const duration = result?.experience?.current?.duration?.currentJob;
    expect(duration?.min).toEqual({ year: 1, month: 3 });
    expect(duration?.max).toEqual({ year: 3, month: 0 });
  });

  test("badge uses AllAny filter", () => {
    const opts: FilterOpts = { badge: ["HIRING"], excludeBadge: ["OPEN_TO_WORK"] };
    const result = buildContactFilter(opts);
    expect(result?.profileBadge).toEqual({
      any: { include: ["HIRING"], exclude: ["OPEN_TO_WORK"] },
    });
  });
});

// ---------------------------------------------------------------------------
// persist.ts — path generation (no filesystem side effects)
// ---------------------------------------------------------------------------

import { buildDefaultPath } from "../src/io/persist.js";

describe("buildDefaultPath", () => {
  test("generates timestamped path under ~/.ai-ark/results/", () => {
    const now = new Date("2026-06-22T14:30:00");
    const path = buildDefaultPath("people-search", now);
    // Should end with the expected filename pattern
    expect(path).toContain("2026-06-22_14-30_people-search.json");
    expect(path).toContain(".ai-ark");
    expect(path).toContain("results");
  });

  test("zero-pads months and days", () => {
    const now = new Date("2026-01-05T09:05:00");
    const path = buildDefaultPath("people-export", now);
    expect(path).toContain("2026-01-05_09-05_people-export.json");
  });
});

// ---------------------------------------------------------------------------
// url-builder.ts — review URL construction
// ---------------------------------------------------------------------------

import { buildSearchUrl } from "../src/url-builder.js";
import type { FilterOpts } from "../src/filters.js";

describe("buildSearchUrl", () => {
  test("returns base URL with no filters", () => {
    const url = buildSearchUrl({}, "people");
    expect(url).toBe("https://app.ai-ark.com/search/people");
  });

  test("returns company URL for companies surface", () => {
    const url = buildSearchUrl({}, "companies");
    expect(url).toBe("https://app.ai-ark.com/search/company");
  });

  test("encodes title in query string", () => {
    const opts: FilterOpts = { title: ["VP of Sales"] };
    const url = buildSearchUrl(opts, "people");
    expect(url).toContain("current_job_include_job_title=VP%20of%20Sales");
  });

  test("joins multiple seniority values with ^", () => {
    const opts: FilterOpts = { seniority: ["vp", "director"] };
    const url = buildSearchUrl(opts, "people");
    expect(url).toContain("current_job_role_seniority=vp%5Edirector");
  });

  test("domain does NOT appear in the URL (platform limitation)", () => {
    const opts: FilterOpts = { domain: ["hubspot.com"] };
    const url = buildSearchUrl(opts, "people");
    // Domains are intentionally dropped from the URL
    expect(url).not.toContain("hubspot.com");
    expect(url).not.toContain("domain");
  });

  test("employee size encodes as custom range", () => {
    const opts: FilterOpts = { employees: "50-200" };
    const url = buildSearchUrl(opts, "people");
    expect(url).toContain("employee_size_custom=50%3E200");
  });
});
