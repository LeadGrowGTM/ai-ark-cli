/**
 * AI Ark platform URL builder.
 *
 * Projects CLI FilterOpts into a clickable https://app.ai-ark.com/search/people
 * (or /search/companies) URL so users can review every search in-platform.
 *
 * Grammar reference: docs/url-grammar.md
 *
 * Two separators:
 *   "^"  — multi-value OR (e.g. title include, location list)
 *   "::" — hierarchy (continent::country)
 *
 * Duration format: "{minY}:{minM}>{maxY}:{maxM}" — empty segment means 0.
 *
 * Known limitation:
 *   bulk_include_company_domain requires a real server-generated session UUID.
 *   Fake UUIDs break the whole URL (platform-confirmed 2026-04-10), so we
 *   DROP the param entirely and emit the domain list as a side-channel note
 *   for manual paste into the platform. All other filters load correctly.
 */

import type { FilterOpts } from "./filters.js";

const BASE_URL = "https://app.ai-ark.com";

export type SearchSurface = "people" | "companies";

/**
 * Join multi-value filters with "^" — the AI Ark UI separator for OR lists.
 */
function joinMulti(values: string[]): string {
  return values.join("^");
}

/**
 * Build the current_job_experience_current_job duration param.
 * Input: min/max months. Output: "{Y}:{M}>{Y}:{M}" with empty segments
 * omitted when zero (matches the observed ":2>1:" shape).
 */
function encodeDuration(minMonths?: string, maxMonths?: string): string | undefined {
  if (!minMonths && !maxMonths) return undefined;

  const fmt = (totalMonths: string | undefined): string => {
    if (!totalMonths) return ":";
    const n = parseInt(totalMonths, 10);
    if (isNaN(n)) return ":";
    const years = Math.floor(n / 12);
    const months = n % 12;
    return `${years || ""}:${months || ""}`;
  };

  return `${fmt(minMonths)}>${fmt(maxMonths)}`;
}

/**
 * Normalize a location string. If it already contains "::" pass it through
 * (e.g. "Europe::Spain"). Otherwise emit as-is and let the platform match.
 */
function encodeLocation(loc: string): string {
  return loc.trim();
}

/**
 * Build a clickable platform search URL from FilterOpts.
 *
 * Only maps filters the platform UI actually exposes as query params. Filters
 * without a known mapping (geo, retail size, etc.) are silently dropped — the
 * URL is for review, not reproduction.
 */
export function buildSearchUrl(
  opts: FilterOpts,
  surface: SearchSurface = "people",
): string {
  const params = new URLSearchParams();

  // --- Company domain (intentionally dropped) -----------------------------
  // bulk_include_company_domain / bulk_exclude_company_domain require real
  // server-generated session UUIDs; fake UUIDs break the entire URL.
  // Domains are surfaced via printReviewUrl's side-channel note instead.

  // --- Company name --------------------------------------------------------
  // In people surface the company name lives on `company`; in companies surface on `name`.
  const companyName = surface === "people" ? opts.company : opts.name;
  const companyNameExclude =
    surface === "people" ? opts.excludeCompany : opts.excludeName;
  if (companyName && companyName.length > 0) {
    params.set("company_include_name", joinMulti(companyName));
  }
  if (companyNameExclude && companyNameExclude.length > 0) {
    params.set("company_exclude_name", joinMulti(companyNameExclude));
  }

  // --- Industry ------------------------------------------------------------
  if (opts.industry && opts.industry.length > 0) {
    params.set("company_include_industry", joinMulti(opts.industry));
  }
  if (opts.excludeIndustry && opts.excludeIndustry.length > 0) {
    params.set("company_exclude_industry", joinMulti(opts.excludeIndustry));
  }

  // --- Technology ----------------------------------------------------------
  if (opts.technology && opts.technology.length > 0) {
    params.set("company_include_technology", joinMulti(opts.technology));
  }

  // --- Employee size range -------------------------------------------------
  if (opts.employees) {
    const [min, max] = opts.employees.split("-");
    if (min && max) params.set("company_employees", `${min}>${max}`);
  }

  // --- Funding -------------------------------------------------------------
  if (opts.fundingType && opts.fundingType.length > 0) {
    params.set("company_include_funding_type", joinMulti(opts.fundingType));
  }

  // --- Contact-scoped filters (people surface only) -----------------------
  if (surface === "people") {
    // Title include/exclude — the big observability win.
    if (opts.title && opts.title.length > 0) {
      params.set("current_job_include_job_title", joinMulti(opts.title));
    }
    if (opts.excludeTitle && opts.excludeTitle.length > 0) {
      params.set("current_job_exclude_job_title", joinMulti(opts.excludeTitle));
    }

    // Previous title
    if (opts.previousTitle && opts.previousTitle.length > 0) {
      params.set("previous_job_include_job_title", joinMulti(opts.previousTitle));
    }

    // Seniority
    if (opts.seniority && opts.seniority.length > 0) {
      params.set("current_job_include_seniority", joinMulti(opts.seniority));
    }
    if (opts.excludeSeniority && opts.excludeSeniority.length > 0) {
      params.set("current_job_exclude_seniority", joinMulti(opts.excludeSeniority));
    }

    // Department
    if (opts.department && opts.department.length > 0) {
      params.set("current_job_include_department", joinMulti(opts.department));
    }
    if (opts.excludeDepartment && opts.excludeDepartment.length > 0) {
      params.set("current_job_exclude_department", joinMulti(opts.excludeDepartment));
    }

    // Job duration — min/max months in current role.
    const duration = encodeDuration(opts.jobDurationMin, opts.jobDurationMax);
    if (duration) {
      params.set("current_job_experience_current_job", duration);
    }

    // Keyword (contact-level, e.g. "gtm")
    const kw = opts.contactKeyword || opts.keyword;
    if (kw && kw.length > 0) {
      params.set("people_include_keywords", joinMulti(kw));
    }

    // Skills
    if (opts.skills && opts.skills.length > 0) {
      params.set("people_include_skills", joinMulti(opts.skills));
    }

    // Profile badge
    if (opts.badge && opts.badge.length > 0) {
      params.set("profile_badge_contacts_include", joinMulti(opts.badge));
    }
    if (opts.excludeBadge && opts.excludeBadge.length > 0) {
      params.set("profile_badge_contacts_exclude", joinMulti(opts.excludeBadge));
    }

    // Contact location (supports "Continent::Country" hierarchy)
    if (opts.location && opts.location.length > 0) {
      params.set(
        "contact_include_location_region",
        opts.location.map(encodeLocation).join("^"),
      );
    }
    if (opts.excludeLocation && opts.excludeLocation.length > 0) {
      params.set(
        "contact_exclude_location_region",
        opts.excludeLocation.map(encodeLocation).join("^"),
      );
    }

    // Person name
    if (opts.name && opts.name.length > 0) {
      params.set("people_include_name", joinMulti(opts.name));
    }
  }

  // --- Company-surface location -------------------------------------------
  if (surface === "companies") {
    if (opts.location && opts.location.length > 0) {
      params.set(
        "company_include_location_region",
        opts.location.map(encodeLocation).join("^"),
      );
    }
    if (opts.excludeLocation && opts.excludeLocation.length > 0) {
      params.set(
        "company_exclude_location_region",
        opts.excludeLocation.map(encodeLocation).join("^"),
      );
    }
    if (opts.keyword && opts.keyword.length > 0) {
      params.set("company_include_keywords", joinMulti(opts.keyword));
    }
  }

  // URLSearchParams encodes spaces as "+" (form-encoding). Swap to "%20"
  // so the URL survives copy-paste through markdown renderers, terminals,
  // and chat clients that mis-handle "+" as a literal plus.
  const qs = params.toString().replace(/\+/g, "%20");
  const path = surface === "people" ? "/search/people" : "/search/companies";
  return qs ? `${BASE_URL}${path}?${qs}` : `${BASE_URL}${path}`;
}

/**
 * Emit the review URL to stderr so stdout stays clean for JSON/CSV piping.
 * Called by search/export commands after they resolve the final filter opts.
 *
 * The URL does NOT carry company domains — domains are emitted as a separate
 * "Paste in-platform" note since the bulk_include_company_domain param
 * requires a server-side session UUID we can't generate client-side.
 */
export function printReviewUrl(opts: FilterOpts, surface: SearchSurface = "people"): void {
  const url = buildSearchUrl(opts, surface);
  process.stderr.write(`\n🔗 Review in AI Ark: ${url}\n`);

  if (opts.domain && opts.domain.length > 0) {
    process.stderr.write(
      `📋 Paste these ${opts.domain.length} domain(s) into the platform's include box:\n`,
    );
    process.stderr.write(`   ${opts.domain.join(", ")}\n`);
  }
  if (opts.excludeDomain && opts.excludeDomain.length > 0) {
    process.stderr.write(
      `📋 Paste these ${opts.excludeDomain.length} domain(s) into the exclude box:\n`,
    );
    process.stderr.write(`   ${opts.excludeDomain.join(", ")}\n`);
  }
  process.stderr.write("\n");
}
