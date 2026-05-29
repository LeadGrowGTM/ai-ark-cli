/**
 * Tier-1 field filter — picks GTM-gold fields from raw API responses.
 * Profile "outbound" keeps only Tier 1 fields, restructured into a flat shape.
 * Profile "raw" returns input unchanged — existing pipe workflows are unaffected.
 */

export type Profile = "outbound" | "raw";
export type EntityKind = "person" | "company";

/** Tier 1 output keys for Person (flat shape from filterPerson). */
export const PERSON_TIER1_FIELDS = [
  "first_name",
  "last_name",
  "headline",
  "title",
  "summary",
  "linkedin",
  "city",
  "state",
  "country",
  "industry",
  "current_company",
  "current_company_linkedin",
  "current_title",
  "current_role_start",
  "skills",
  "member_badges",
  "seniority",
  "followers_count",
  "connections_count",
  "email",
  "emailVerified",
  "phones",
  "last_updated",
] as const;

/** Tier 1 output keys for Company (flat shape from filterCompany). */
export const COMPANY_TIER1_FIELDS = [
  "id",
  "description",
  "overview",
  "seo",
  "staff_total",
  "domain",
  "linkedin",
  "contact_email",
  "revenue_range",
  "funding_type",
  "funding_total_amount",
  "funding_last_amount",
  "funding_num_investor",
  "funding_round_investors",
  "raw_address",
  "technologies",
  "industries",
  "keywords",
  "last_updated",
] as const;

/** Safe nested property access via dotted path. Returns undefined (never throws) for missing paths. */
function get(obj: any, path: string): unknown {
  return path.split(".").reduce((acc: any, key: string) => (acc == null ? undefined : acc[key]), obj);
}

/** Extract Tier 1 fields from a raw Person API response. */
function filterPerson(p: any): Record<string, unknown> {
  const pos0 = p.position_groups?.[0];
  const role0 = pos0?.profile_positions?.[0];
  return {
    first_name: get(p, "profile.first_name"),
    last_name: get(p, "profile.last_name"),
    headline: get(p, "profile.headline"),
    title: get(p, "profile.title"),
    summary: get(p, "profile.summary"),
    linkedin: get(p, "link.linkedin"),
    city: get(p, "location.city"),
    state: get(p, "location.state"),
    country: get(p, "location.country"),
    industry: p.industry,
    current_company: pos0?.company?.name,
    current_company_linkedin: pos0?.company?.url,
    current_title: role0?.title,
    current_role_start: pos0?.date?.start,
    skills: p.skills,
    member_badges: p.member_badges,
    seniority: get(p, "department.seniority"),
    followers_count: get(p, "statistics.network.followers_count"),
    connections_count: get(p, "statistics.network.connections_count"),
    email: p.email,
    emailVerified: p.emailVerified,
    phones: Array.isArray(p.phones)
      ? p.phones.map((ph: any) => ({ phoneNumber: ph.phoneNumber }))
      : undefined,
    last_updated: p.last_updated,
  };
}

/** Extract Tier 1 fields from a raw Company API response. */
function filterCompany(c: any): Record<string, unknown> {
  const rounds = get(c, "financial.funding.rounds");
  return {
    id: c.id,
    description: get(c, "summary.description"),
    overview: get(c, "summary.overview"),
    seo: get(c, "summary.seo"),
    staff_total: get(c, "summary.staff.total"),
    domain: get(c, "link.domain"),
    linkedin: get(c, "link.linkedin"),
    contact_email: get(c, "contact.email"),
    revenue_range: get(c, "financial.revenue.annual.amount"),
    funding_type: get(c, "financial.funding.type"),
    funding_total_amount: get(c, "financial.funding.total_amount"),
    funding_last_amount: get(c, "financial.funding.last_amount"),
    funding_num_investor: get(c, "financial.funding.num_investor"),
    funding_round_investors: Array.isArray(rounds)
      ? (rounds as any[]).map((r) => r.investors).filter(Boolean)
      : undefined,
    raw_address: get(c, "location.headquarter.raw_address"),
    technologies: c.technologies,
    industries: c.industries,
    keywords: c.keywords,
    last_updated: c.last_updated,
  };
}

/**
 * Filter API response data by profile.
 *
 * - profile "raw": returns input unchanged (byte-for-byte API response preserved)
 * - profile "outbound" (default): returns Tier 1 fields in a flat, GTM-optimized shape
 *
 * Handles three input shapes:
 * 1. Single object → filtered object
 * 2. Array → filtered array (same length)
 * 3. `{content: [...], ...}` wrapper → wrapper preserved, content filtered
 */
export function filterByProfile(
  data: unknown,
  kind: EntityKind,
  profile: Profile = "outbound",
): unknown {
  if (profile === "raw") return data;

  const filterOne = kind === "person" ? filterPerson : filterCompany;

  if (Array.isArray(data)) {
    return data.map((item) => filterOne(item));
  }

  // Preserve {content: [...], ...} wrapper shape (e.g. PeopleSearchResponse)
  if (data && typeof data === "object" && Array.isArray((data as any).content)) {
    return { ...(data as any), content: (data as any).content.map(filterOne) };
  }

  return filterOne(data);
}
