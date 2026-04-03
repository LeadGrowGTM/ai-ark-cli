/**
 * Request body type definitions for all AI Ark API endpoints.
 */

import type {
  FilterWithAllAny,
  AccountSearchMatchFilter,
  ContactSearchMatchFilter,
  RangeWithType,
  DateRange,
} from "./common.js";

// ---------------------------------------------------------------------------
// Shared account filter (used across Company Search, People Search, Export)
// ---------------------------------------------------------------------------

export interface GeoLocation {
  position: {
    lat: number;
    lng: number;
  };
  radius: number;
  unit: "km" | "mi";
}

export interface FundingFilter {
  type?: string[];
  totalAmount?: RangeWithType;
  lastAmount?: RangeWithType;
  duration?: RangeWithType;
}

export interface AccountFilter {
  domain?: FilterWithAllAny;
  linkedin?: FilterWithAllAny;
  url?: AccountSearchMatchFilter;
  name?: AccountSearchMatchFilter;
  socialMediaLink?: FilterWithAllAny;
  phoneNumber?: FilterWithAllAny;
  industries?: AccountSearchMatchFilter;
  location?: FilterWithAllAny;
  productAndServices?: AccountSearchMatchFilter;
  socialMedia?: FilterWithAllAny;
  type?: FilterWithAllAny;
  foundedYear?: RangeWithType;
  language?: FilterWithAllAny;
  geoLocation?: GeoLocation;
  employeeSize?: RangeWithType;
  retailSize?: RangeWithType;
  revenue?: RangeWithType;
  funding?: FundingFilter;
  keyword?: AccountSearchMatchFilter;
  metric?: Record<string, unknown>;
  technologies?: AccountSearchMatchFilter;
  naics?: FilterWithAllAny;
}

// ---------------------------------------------------------------------------
// Contact filter (used across People Search, Export People, Phone Finder)
// ---------------------------------------------------------------------------

export interface EducationFilter {
  school?: ContactSearchMatchFilter;
  degree?: FilterWithAllAny;
  fieldOfStudy?: ContactSearchMatchFilter;
  date?: {
    start?: DateRange;
    end?: DateRange;
  };
}

export interface ExperienceFilter {
  current?: {
    title?: ContactSearchMatchFilter;
    duration?: {
      currentJob?: { min?: { year: number; month: number }; max?: { year: number; month: number } };
    };
  };
  latest?: {
    title?: ContactSearchMatchFilter;
  };
  previous?: {
    title?: ContactSearchMatchFilter;
  };
}

export interface ContactFilter {
  // Profile
  fullName?: ContactSearchMatchFilter;
  socialMediaLink?: FilterWithAllAny;
  linkedin?: FilterWithAllAny;
  location?: FilterWithAllAny;
  languageSkills?: FilterWithAllAny;
  profileBadge?: FilterWithAllAny;
  // Professional
  company?: FilterWithAllAny;
  seniority?: FilterWithAllAny;
  departmentAndFunction?: FilterWithAllAny;
  experience?: ExperienceFilter;
  // Skills & Education
  skill?: ContactSearchMatchFilter;
  certification?: ContactSearchMatchFilter;
  education?: EducationFilter;
  keyword?: ContactSearchMatchFilter;
  socialMedia?: FilterWithAllAny;
  language?: ContactSearchMatchFilter;
}

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

/** POST /companies */
export interface CompanySearchRequest {
  page: number;
  size: number;
  lookalikeDomains?: string[];
  account?: AccountFilter;
}

/** POST /people */
export interface PeopleSearchRequest {
  page: number;
  size: number;
  account?: AccountFilter;
  contact?: ContactFilter;
}

/** POST /people/reverse-lookup */
export interface ReverseLookupRequest {
  kind: "CONTACT";
  search: string;
}

/** POST /people/mobile-phone-finder */
export interface MobilePhoneRequest {
  linkedinUrl?: string;
  domain?: string;
  name?: string;
  type: string;
}

/** POST /people/analysis */
export interface PersonalityAnalysisRequest {
  url: string;
}

/** POST /people/export */
export interface ExportPeopleRequest {
  page: number;
  size: number;
  webhook?: string;
  account?: AccountFilter;
  contact?: ContactFilter;
}

/** POST /people/email-finder */
export interface EmailFinderRequest {
  trackId: string;
  webhook?: string;
}

/** POST /people/export/single */
export interface ExportSingleRequest {
  id?: string;
  url?: string;
}
