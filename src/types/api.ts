/**
 * Barrel export for all AI Ark API types.
 * Import from here: `import type { Person, CompanySearchRequest } from "./types/api.js"`
 */

export type * from "./common.js";
export type * from "./responses.js";
export type * from "./requests.js";

export type ApiEndpoint =
  | "/companies"
  | "/people"
  | "/people/reverse-lookup"
  | "/people/mobile-phone-finder"
  | "/people/analysis"
  | "/people/export"
  | `/people/export/${string}/inquiries`
  | `/people/export/${string}/inquiries/statistics`
  | "/people/email-finder"
  | `/people/email-finder/${string}/statistics`
  | `/people/email-finder/${string}/inquiries`
  | "/payments/credits";
