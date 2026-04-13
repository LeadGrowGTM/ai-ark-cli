/**
 * Shared filter builders for AI Ark API requests.
 *
 * Two filter shapes:
 *   AllAny:       { any: { include: ["v"], exclude: ["x"] } }
 *   SearchMatch:  { any: { include: { mode, content }, exclude: { mode, content } } }
 *
 * Default search mode: SMART (covers 95% of use cases).
 */

import type { SearchMode } from "./types/common.js";
import type { AccountFilter, ContactFilter } from "./types/requests.js";
import { readCsvFile } from "./io/index.js";

// ---------------------------------------------------------------------------
// Filter shape builders
// ---------------------------------------------------------------------------

export function allAnyFilter(
  include?: string[],
  exclude?: string[],
  useAll = false,
): Record<string, unknown> | undefined {
  if (!include && !exclude) return undefined;
  const key = useAll ? "all" : "any";
  const condition: Record<string, string[]> = {};
  if (include) condition.include = include;
  if (exclude) condition.exclude = exclude;
  return { [key]: condition };
}

export function searchMatchFilter(
  include?: string[],
  exclude?: string[],
  mode: SearchMode = "SMART",
): Record<string, unknown> | undefined {
  if (!include && !exclude) return undefined;
  const condition: Record<string, { mode: SearchMode; content: string[] }> = {};
  if (include) condition.include = { mode, content: include };
  if (exclude) condition.exclude = { mode, content: exclude };
  return { any: condition };
}

export function rangeFilter(rangeStr: string): Record<string, unknown> | undefined {
  const [min, max] = rangeStr.split("-").map(Number);
  if (isNaN(min) || isNaN(max)) return undefined;
  return { type: "RANGE", range: [{ start: min, end: max }] };
}

// ---------------------------------------------------------------------------
// Months → year+month helper for job duration
// ---------------------------------------------------------------------------

function toYearMonth(months: number): { year: number; month: number } {
  return { year: Math.floor(months / 12), month: months % 12 };
}

// ---------------------------------------------------------------------------
// CLI options interface (shared across commands)
// ---------------------------------------------------------------------------

export interface FilterOpts {
  // Account includes
  domain?: string[];
  name?: string[];
  company?: string[];        // alias for account.name in people commands
  industry?: string[];
  location?: string[];
  technology?: string[];
  employees?: string;
  keyword?: string[];
  fundingType?: string[];
  geo?: string;
  geoUnit?: string;
  products?: string[];
  lookalike?: string[];
  revenue?: string;
  retailSize?: string;
  founded?: string;

  // Account excludes
  excludeDomain?: string[];
  excludeName?: string[];
  excludeCompany?: string[];
  excludeIndustry?: string[];
  excludeLocation?: string[];
  excludeDomainFile?: string;
  excludeDomainCol?: string;

  // Contact includes
  title?: string[];
  seniority?: string[];
  department?: string[];
  skills?: string[];
  linkedin?: string[];
  badge?: string[];
  previousTitle?: string[];
  jobDurationMin?: string;
  jobDurationMax?: string;
  contactKeyword?: string[];

  // Contact excludes
  excludeTitle?: string[];
  excludeSeniority?: string[];
  excludeDepartment?: string[];
  excludeBadge?: string[];
  excludeContactName?: string[];

  // Global
  matchMode?: string;

  // Resolved names — people commands use --name for person, --company for account
  // companies command uses --name for account
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Build account filter from CLI opts
// ---------------------------------------------------------------------------

export function buildAccountFilter(
  opts: FilterOpts,
  context: "company" | "people",
): AccountFilter | undefined {
  const mode = (opts.matchMode as SearchMode) || "SMART";
  const acct: AccountFilter = {};
  let hasFilter = false;

  // Domain (AllAny, use 'all' for domain)
  const domains = opts.domain || [];
  const excludeDomains = loadExcludeDomains(opts);
  if (domains.length > 0 || excludeDomains.length > 0) {
    acct.domain = allAnyFilter(
      domains.length > 0 ? domains : undefined,
      excludeDomains.length > 0 ? excludeDomains : undefined,
      true, // domain uses 'all'
    ) as AccountFilter["domain"];
    hasFilter = true;
  }

  // Name (SearchMatch) — in company cmd it's --name, in people cmd it's --company
  const nameInclude = context === "company" ? opts.name : opts.company;
  const nameExclude = context === "company" ? opts.excludeName : opts.excludeCompany;
  if (nameInclude || nameExclude) {
    acct.name = searchMatchFilter(nameInclude, nameExclude, mode) as AccountFilter["name"];
    hasFilter = true;
  }

  // Industries (SearchMatch, plural field name)
  if (opts.industry || opts.excludeIndustry) {
    acct.industries = searchMatchFilter(opts.industry, opts.excludeIndustry, "WORD") as AccountFilter["industries"];
    hasFilter = true;
  }

  // Technologies (SearchMatch, plural field name)
  if (opts.technology) {
    acct.technologies = searchMatchFilter(opts.technology, undefined, "WORD") as AccountFilter["technologies"];
    hasFilter = true;
  }

  // Location (AllAny)
  const locInclude = context === "company" ? opts.location : undefined; // people use contact.location
  const locExclude = context === "company" ? opts.excludeLocation : undefined;
  if (locInclude || locExclude) {
    acct.location = allAnyFilter(locInclude, locExclude) as AccountFilter["location"];
    hasFilter = true;
  }

  // Employee size (Range)
  if (opts.employees) {
    const range = rangeFilter(opts.employees);
    if (range) {
      acct.employeeSize = range as AccountFilter["employeeSize"];
      hasFilter = true;
    }
  }

  // Keyword (SearchMatch)
  if (opts.keyword && context === "company") {
    acct.keyword = searchMatchFilter(opts.keyword, undefined, mode) as AccountFilter["keyword"];
    hasFilter = true;
  }

  // Funding type
  if (opts.fundingType) {
    acct.funding = { type: opts.fundingType };
    hasFilter = true;
  }

  // GeoLocation
  if (opts.geo) {
    const geo = parseGeo(opts.geo, opts.geoUnit || "km");
    if (geo) {
      acct.geoLocation = geo;
      hasFilter = true;
    }
  }

  // Product & Services (SearchMatch)
  if (opts.products) {
    acct.productAndServices = searchMatchFilter(opts.products, undefined, mode) as AccountFilter["productAndServices"];
    hasFilter = true;
  }

  // Revenue (Range)
  if (opts.revenue) {
    const range = rangeFilter(opts.revenue as string);
    if (range) {
      acct.revenue = range as AccountFilter["revenue"];
      hasFilter = true;
    }
  }

  // Retail Size (Range)
  if (opts.retailSize) {
    const range = rangeFilter(opts.retailSize as string);
    if (range) {
      acct.retailSize = range as AccountFilter["retailSize"];
      hasFilter = true;
    }
  }

  return hasFilter ? acct : undefined;
}

// ---------------------------------------------------------------------------
// Build contact filter from CLI opts
// ---------------------------------------------------------------------------

export function buildContactFilter(opts: FilterOpts): ContactFilter | undefined {
  const mode = (opts.matchMode as SearchMode) || "SMART";
  const contact: ContactFilter = {};
  let hasFilter = false;

  // Full name (SearchMatch) — in people commands, --name is person name
  if (opts.name || opts.excludeContactName) {
    contact.fullName = searchMatchFilter(opts.name, opts.excludeContactName, mode) as ContactFilter["fullName"];
    hasFilter = true;
  }

  // Location (AllAny)
  if (opts.location || opts.excludeLocation) {
    contact.location = allAnyFilter(opts.location, opts.excludeLocation) as ContactFilter["location"];
    hasFilter = true;
  }

  // Seniority (AllAny)
  if (opts.seniority || opts.excludeSeniority) {
    contact.seniority = allAnyFilter(opts.seniority, opts.excludeSeniority) as ContactFilter["seniority"];
    hasFilter = true;
  }

  // Department (AllAny)
  if (opts.department || opts.excludeDepartment) {
    contact.departmentAndFunction = allAnyFilter(opts.department, opts.excludeDepartment) as ContactFilter["departmentAndFunction"];
    hasFilter = true;
  }

  // Title (SearchMatch) + job duration
  if (opts.title || opts.excludeTitle || opts.jobDurationMin || opts.jobDurationMax) {
    const titleFilter = (opts.title || opts.excludeTitle)
      ? searchMatchFilter(opts.title, opts.excludeTitle, mode)
      : undefined;

    const durationFilter = (opts.jobDurationMin || opts.jobDurationMax)
      ? {
          currentJob: {
            ...(opts.jobDurationMin ? { min: toYearMonth(parseInt(opts.jobDurationMin, 10)) } : {}),
            ...(opts.jobDurationMax ? { max: toYearMonth(parseInt(opts.jobDurationMax, 10)) } : {}),
          },
        }
      : undefined;

    contact.experience = {
      current: {
        ...(titleFilter ? { title: titleFilter } : {}),
        ...(durationFilter ? { duration: durationFilter } : {}),
      },
    } as ContactFilter["experience"];
    hasFilter = true;
  }

  // Skills (SearchMatch)
  if (opts.skills) {
    contact.skill = searchMatchFilter(opts.skills, undefined, mode) as ContactFilter["skill"];
    hasFilter = true;
  }

  // LinkedIn (AllAny, use 'all')
  if (opts.linkedin) {
    contact.linkedin = allAnyFilter(opts.linkedin, undefined, true) as ContactFilter["linkedin"];
    hasFilter = true;
  }

  // Profile badge (AllAny)
  if (opts.badge || opts.excludeBadge) {
    contact.profileBadge = allAnyFilter(opts.badge, opts.excludeBadge) as ContactFilter["profileBadge"];
    hasFilter = true;
  }

  // Keyword (SearchMatch) — contact-level keyword
  const kw = opts.contactKeyword || (opts.keyword ? opts.keyword : undefined);
  if (kw) {
    contact.keyword = searchMatchFilter(kw, undefined, mode) as ContactFilter["keyword"];
    hasFilter = true;
  }

  // Previous title (SearchMatch)
  if (opts.previousTitle) {
    contact.experience = {
      ...contact.experience,
      previous: {
        title: searchMatchFilter(opts.previousTitle, undefined, mode),
      },
    } as ContactFilter["experience"];
    hasFilter = true;
  }

  return hasFilter ? contact : undefined;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadExcludeDomains(opts: FilterOpts): string[] {
  const domains: string[] = opts.excludeDomain ? [...opts.excludeDomain] : [];
  if (opts.excludeDomainFile) {
    const col = opts.excludeDomainCol || "domain";
    const records = readCsvFile(opts.excludeDomainFile);
    const csvDomains = records.map((r) => r[col]).filter(Boolean);
    domains.push(...csvDomains);
  }
  return domains;
}

function parseGeo(
  geoStr: string,
  unit: string,
): { position: { lat: number; lng: number }; radius: number; unit: "km" | "mi" } | undefined {
  // Format: "lat,lng,radius" or "lat,lng,radiuskm" or "lat,lng,radiusmi"
  const parts = geoStr.split(",").map((s) => s.trim());
  if (parts.length < 3) return undefined;

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  const radiusPart = parts[2];

  let radius: number;
  let resolvedUnit: "km" | "mi" = unit === "mi" ? "mi" : "km";

  if (radiusPart.endsWith("km")) {
    radius = parseFloat(radiusPart.replace("km", ""));
    resolvedUnit = "km";
  } else if (radiusPart.endsWith("mi")) {
    radius = parseFloat(radiusPart.replace("mi", ""));
    resolvedUnit = "mi";
  } else {
    radius = parseFloat(radiusPart);
  }

  if (isNaN(lat) || isNaN(lng) || isNaN(radius)) return undefined;

  return { position: { lat, lng }, radius, unit: resolvedUnit };
}
