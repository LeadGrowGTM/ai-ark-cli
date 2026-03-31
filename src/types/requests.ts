/**
 * Request body type definitions for all AI Ark API endpoints.
 */

import type {
  FilterWithAllAny,
  FilterWithAllAnyPlusSearchMatch,
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
  url?: FilterWithAllAnyPlusSearchMatch;
  name?: FilterWithAllAnyPlusSearchMatch;
  socialMediaLink?: FilterWithAllAny;
  phoneNumber?: FilterWithAllAny;
  industries?: FilterWithAllAnyPlusSearchMatch;
  location?: FilterWithAllAny;
  productAndServices?: FilterWithAllAnyPlusSearchMatch;
  socialMedia?: FilterWithAllAny;
  type?: FilterWithAllAny;
  foundedYear?: RangeWithType;
  language?: FilterWithAllAny;
  geoLocation?: GeoLocation;
  employeeSize?: RangeWithType;
  revenue?: RangeWithType;
  funding?: FundingFilter;
  keyword?: FilterWithAllAnyPlusSearchMatch;
  metric?: Record<string, unknown>;
  technologies?: FilterWithAllAnyPlusSearchMatch;
  naics?: FilterWithAllAny;
}

// ---------------------------------------------------------------------------
// Contact filter (used across People Search, Export People, Phone Finder)
// ---------------------------------------------------------------------------

export interface EducationFilter {
  school?: FilterWithAllAnyPlusSearchMatch;
  degree?: FilterWithAllAny;
  fieldOfStudy?: FilterWithAllAnyPlusSearchMatch;
  date?: {
    start?: DateRange;
    end?: DateRange;
  };
}

export interface ExperienceFilter {
  currentTitle?: FilterWithAllAnyPlusSearchMatch;
  previousTitle?: FilterWithAllAnyPlusSearchMatch;
  duration?: RangeWithType;
}

export interface ContactFilter {
  // Profile
  fullName?: FilterWithAllAnyPlusSearchMatch;
  socialMediaLink?: FilterWithAllAny;
  linkedin?: FilterWithAllAny;
  location?: FilterWithAllAny;
  languageSkills?: FilterWithAllAny;
  profileBadge?: FilterWithAllAny;
  // Professional
  currentCompany?: FilterWithAllAny;
  pastCompany?: FilterWithAllAny;
  seniority?: FilterWithAllAny;
  department?: FilterWithAllAny;
  experience?: ExperienceFilter;
  // Skills & Education
  skills?: FilterWithAllAnyPlusSearchMatch;
  certifications?: FilterWithAllAnyPlusSearchMatch;
  education?: EducationFilter;
  keywords?: FilterWithAllAnyPlusSearchMatch;
  socialMedia?: FilterWithAllAny;
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
