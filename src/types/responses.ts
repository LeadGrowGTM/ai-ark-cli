/**
 * Response type definitions for all AI Ark API endpoints.
 * Types derived from real API response examples in docs/api-reference/examples/.
 */

import type {
  PaginatedResponse,
  PaginatedPeopleResponse,
  DateRange,
} from "./common.js";

// ---------------------------------------------------------------------------
// Credit
// ---------------------------------------------------------------------------

/** GET /payments/credits */
export interface CreditResponse {
  total: number;
}

// ---------------------------------------------------------------------------
// Company types
// ---------------------------------------------------------------------------

export interface CompanyStaffRange {
  start: number;
  end: number;
}

export interface CompanyStaff {
  total: number;
  range: CompanyStaffRange;
}

export interface CompanyLogo {
  source: string;
}

export interface CompanySummary {
  name: string;
  description: string;
  founded_year: number | null;
  type: string;
  industry: string;
  staff: CompanyStaff;
  logo: CompanyLogo;
}

export interface CompanyLink {
  website: string | null;
  domain: string | null;
  domain_ltd: string | null;
  linkedin: string | null;
}

export interface Company {
  id: string;
  summary: CompanySummary;
  link: CompanyLink;
  industries: string[];
  keywords: string[];
  languages: string[];
  last_updated: string;
}

/** POST /companies response */
export type CompanySearchResponse = PaginatedResponse<Company>;

// ---------------------------------------------------------------------------
// Person types
// ---------------------------------------------------------------------------

export interface PersonPicture {
  source: string;
}

export interface PersonBackground {
  source: string;
}

export interface PersonProfile {
  first_name: string;
  last_name: string;
  full_name: string;
  headline: string | null;
  title: string | null;
  picture: PersonPicture | null;
  background: PersonBackground | null;
  birth_date: string | null;
  summary: string | null;
}

export interface PersonLink {
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
  facebook: string | null;
}

export interface PersonLocation {
  default: string | null;
  short: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  position: string | null;
}

export interface Locale {
  country: string;
  language: string;
}

export interface PersonLanguages {
  primary_locale: Locale;
  supported_locales: Locale[];
  profile_languages: string[] | null;
}

export interface School {
  id: string;
  name: string;
  logo: string;
  url: string;
}

export interface Education {
  school: School;
  degree_name: string | null;
  field_of_study: string | null;
  grade: string | null;
  date: DateRange;
}

export interface CertificationCompany {
  id: string;
  name: string;
  logo: string;
  url: string;
}

export interface Certification {
  name: string;
  authority: string | null;
  url: string | null;
  license_number: string | null;
  display_source: string | null;
  company: CertificationCompany | null;
  date: DateRange;
}

export interface PositionCompany {
  id: string;
  name: string;
  logo: string;
  url: string;
  employees: CompanyStaffRange;
}

export interface ProfilePosition {
  company: string;
  description: string | null;
  title: string;
  employment_type: string | null;
  location: string | null;
  date: DateRange;
}

export interface PositionGroup {
  company: PositionCompany;
  date: DateRange;
  profile_positions: ProfilePosition[];
}

export interface MemberBadges {
  premium: boolean;
  creator: boolean;
  open_to_work: boolean;
  hiring: boolean;
  verified: boolean;
  influencer: boolean;
}

export interface PersonDepartment {
  departments: string[];
  sub_departments: string[];
  functions: string[];
  seniority: string;
}

export interface Person {
  id: string;
  identifier: string;
  profile: PersonProfile;
  link: PersonLink;
  location: PersonLocation;
  languages: PersonLanguages;
  industry: string | null;
  educations: Education[];
  certifications: Certification[];
  position_groups: PositionGroup[];
  skills: string[];
  member_badges: MemberBadges;
  company: Company | null;
  department: PersonDepartment | null;
  last_updated: string;
}

/** POST /people response */
export type PeopleSearchResponse = PaginatedPeopleResponse<Person>;

/** POST /people/reverse-lookup response */
export type ReverseLookupResponse = Person;

// ---------------------------------------------------------------------------
// Mobile phone finder
// ---------------------------------------------------------------------------

export interface PhoneRecord {
  phoneNumber: string;
  type: string;
  countryCode: string | null;
}

/** POST /people/mobile-phone-finder response */
export interface MobilePhoneResponse {
  phones: PhoneRecord[];
}

// ---------------------------------------------------------------------------
// Personality analysis
// ---------------------------------------------------------------------------

/** POST /people/analysis response */
export interface EmailAdvice {
  definition: string | null;
  advice: string | null;
  example: string | null;
}

export interface CommunicationProfile {
  types: string[];
  descriptions: string[];
  adjectives: string[];
  whatToSay: string[];
  whatToAvoid: string[];
  subject: string | null;
  body: string | null;
}

export interface SellingProfile {
  email: Record<string, EmailAdvice>;
  interests: string[];
  communication: CommunicationProfile;
  keyTraits: {
    risk: string | null;
    abilityToSayNo: string | null;
    speed: string | null;
    decisionDrivers: string | null;
  };
}

export interface AssessmentScore {
  score: number;
  level: string;
}

export interface AssessmentSummary {
  descriptions: string[];
  labels: string[];
}

export interface PersonalityAnalysisResponse {
  model: string;
  source: {
    headline: string;
    refId: string;
    skills: string[];
    summary: string | null;
  };
  score: number;
  selling: SellingProfile;
  hiring: SellingProfile;
  assessments: {
    archetype: string;
    ocean: Record<string, AssessmentScore | AssessmentSummary>;
    disc: Record<string, AssessmentScore | AssessmentSummary>;
  };
  status: string;
  success: boolean;
}

// ---------------------------------------------------------------------------
// Async job statistics (shared between Export People and Email Finder)
// ---------------------------------------------------------------------------

export interface ExportStatistics {
  state: "IN_PROGRESS" | "DONE" | "FAILED" | "PENDING" | "PROCESSING";
  total: number;
  found: number;
  notFound: number;
}

/** GET /people/export/{trackId}/inquiries/statistics */
export type ExportPeopleStatisticsResponse = ExportStatistics;

/** GET /people/email-finder/{trackId}/statistics */
export type EmailFinderStatistics = ExportStatistics;

// ---------------------------------------------------------------------------
// Export people job initiation response
// ---------------------------------------------------------------------------

export interface ExportJobResponse {
  trackId: string;
  state: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  statistics: {
    total: number;
    success: number;
    failed: number;
    found: number;
  };
}

// ---------------------------------------------------------------------------
// Export results (people with emails)
// ---------------------------------------------------------------------------

export interface ExportedPerson extends Person {
  email: string | null;
  emailVerified: boolean | null;
}

/** GET /people/export/{trackId}/inquiries */
export type ExportPeopleResultsResponse = PaginatedResponse<ExportedPerson>;

// ---------------------------------------------------------------------------
// Email finder results
// ---------------------------------------------------------------------------

export interface EmailFinderRecord {
  person: Person;
  email: string | null;
  emailVerified: boolean | null;
  trackId: string;
}

/** GET /people/email-finder/{trackId}/inquiries */
export type EmailFinderResultsResponse = PaginatedResponse<EmailFinderRecord>;
